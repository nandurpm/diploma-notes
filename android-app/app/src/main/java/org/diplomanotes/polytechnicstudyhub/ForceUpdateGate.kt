package org.diplomanotes.polytechnicstudyhub

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import javax.net.ssl.HttpsURLConnection

/**
 * Native update policy gate for the WebView Activity.
 *
 * The gate is intentionally fail-closed: the WebView is not released until the
 * HTTPS policy endpoint has been fetched and validated. A remote policy
 * can require an update by publishing a larger versionCode with forceUpdate=true.
 *
 * This does not install an APK silently. It opens the trusted GitHub Release APK
 * in Android's package installer/browser; after returning, the policy is checked
 * again before the WebView is released.
 */
class ForceUpdateGate @JvmOverloads constructor(
    private val activity: Activity,
    private val manifestUrl: String = DEFAULT_MANIFEST_URL,
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()
    private var dialog: AlertDialog? = null
    private var checking = false
    private var destroyed = false
    private var initialCheckComplete = false
    private var lastCheckAt = 0L
    private var pendingInstallerReturn = false

    fun enforce(onAllowed: Runnable) {
        if (destroyed || checking || activity.isFinishing || activity.isDestroyed) return
        checking = true
        executor.execute {
            val result = runCatching { fetchPolicy() }
            mainHandler.post {
                checking = false
                if (destroyed || activity.isFinishing || activity.isDestroyed) return@post
                initialCheckComplete = true
                lastCheckAt = System.currentTimeMillis()
                result.fold(
                    onSuccess = { policy ->
                        if (policy.mustUpdate) {
                            showUpdateRequired(policy, onAllowed)
                        } else {
                            dismissDialog()
                            onAllowed.run()
                        }
                    },
                    onFailure = { error ->
                        showVerificationFailure(error, onAllowed)
                    },
                )
            }
        }
    }

    /** Re-check after returning from the package installer or after a long pause. */
    fun onResume(onAllowed: Runnable) {
        if (!initialCheckComplete || pendingInstallerReturn ||
            System.currentTimeMillis() - lastCheckAt >= RECHECK_INTERVAL_MS) {
            pendingInstallerReturn = false
            enforce(onAllowed)
        }
    }

    fun destroy() {
        destroyed = true
        dismissDialog()
        executor.shutdownNow()
    }

    private fun showUpdateRequired(policy: Policy, onAllowed: Runnable) {
        dismissDialog()
        val message = buildString {
            append("This version of POLY PMNA is no longer supported.\n\n")
            append("Installed version: ")
            append(BuildConfig.VERSION_NAME)
            append("\nRequired version: ")
            append(policy.versionName)
            append("\n\nInstall the signed update to continue.")
        }
        dialog = AlertDialog.Builder(activity)
            .setTitle("Update required")
            .setMessage(message)
            .setPositiveButton("Update now") { _, _ ->
                pendingInstallerReturn = true
                downloadAndInstall(policy, onAllowed)
            }
            .setNeutralButton("Check again") { _, _ -> enforce(onAllowed) }
            .setNegativeButton("Exit") { _, _ -> activity.finishAffinity() }
            .create()
            .also { blockingDialog ->
                blockingDialog.setCancelable(false)
                blockingDialog.setCanceledOnTouchOutside(false)
                blockingDialog.setOnKeyListener { _, keyCode, event ->
                    keyCode == android.view.KeyEvent.KEYCODE_BACK &&
                        event.action == android.view.KeyEvent.ACTION_UP
                }
                blockingDialog.show()
            }
    }

    private fun showVerificationFailure(error: Throwable, onAllowed: Runnable) {
        dismissDialog()
        AlertDialog.Builder(activity)
            .setTitle("Update check unavailable")
            .setMessage("POLY PMNA cannot verify its security policy. Connect to the internet and try again.")
            .setPositiveButton("Retry") { _, _ -> enforce(onAllowed) }
            .setNegativeButton("Exit") { _, _ -> activity.finishAffinity() }
            .setCancelable(false)
            .create()
            .also { blockingDialog ->
                blockingDialog.setCanceledOnTouchOutside(false)
                blockingDialog.setOnKeyListener { _, keyCode, event ->
                    keyCode == android.view.KeyEvent.KEYCODE_BACK &&
                        event.action == android.view.KeyEvent.ACTION_UP
                }
                dialog = blockingDialog
                blockingDialog.show()
            }
    }

    private fun downloadAndInstall(policy: Policy, onAllowed: Runnable) {
        dismissDialog()
        showDownloading()
        executor.execute {
            val result = runCatching { downloadVerifiedApk(policy) }
            mainHandler.post {
                if (destroyed || activity.isFinishing || activity.isDestroyed) return@post
                result.fold(
                    onSuccess = { file ->
                        dismissDialog()
                        val intent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(
                                FileProvider.getUriForFile(
                                    activity,
                                    activity.packageName + ".fileprovider",
                                    file,
                                ),
                                "application/vnd.android.package-archive",
                            )
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        runCatching { activity.startActivity(intent) }
                            .onFailure { showVerificationFailure(it, onAllowed) }
                    },
                    onFailure = { error -> showVerificationFailure(error, onAllowed) },
                )
            }
        }
    }

    private fun showDownloading() {
        dialog = AlertDialog.Builder(activity)
            .setTitle("Preparing update")
            .setMessage("Downloading and verifying the signed update…")
            .setCancelable(false)
            .create()
            .also { downloadingDialog ->
                downloadingDialog.setCanceledOnTouchOutside(false)
                downloadingDialog.show()
            }
    }

    private fun downloadVerifiedApk(policy: Policy): File {
        var currentUrl = policy.apkUrl
        var connection: HttpsURLConnection? = null
        var input: java.io.InputStream? = null
        val updateDirectory = File(activity.cacheDir, "verified-updates").apply { mkdirs() }
        val temporary = File.createTempFile("poly-pmna-", ".apk.part", updateDirectory)
        try {
            repeat(MAX_REDIRECTS + 1) { redirectAttempt ->
                connection?.disconnect()
                connection = (URL(currentUrl).openConnection() as HttpsURLConnection).apply {
                    instanceFollowRedirects = false
                    connectTimeout = NETWORK_TIMEOUT_MS
                    readTimeout = NETWORK_TIMEOUT_MS
                    requestMethod = "GET"
                    setRequestProperty("Accept", "application/vnd.android.package-archive")
                    setRequestProperty("Cache-Control", "no-cache")
                }
                val responseCode = connection!!.responseCode
                if (responseCode in 300..399) {
                    require(redirectAttempt < MAX_REDIRECTS)
                    val location = connection!!.getHeaderField("Location") ?: error("Missing update redirect")
                    val next = URI(currentUrl).resolve(location)
                    require(next.scheme == "https" && isTrustedApkHost(next.host))
                    currentUrl = next.toString()
                    return@repeat
                }
                require(responseCode == HttpURLConnection.HTTP_OK)
                require(connection!!.contentType?.lowercase()?.startsWith("application/vnd.android.package-archive") == true)
                val contentLength = connection!!.contentLengthLong
                require(contentLength in 1..MAX_APK_BYTES)
                input = connection!!.inputStream
                FileOutputStream(temporary).use { output ->
                    val buffer = ByteArray(8192)
                    var total = 0L
                    while (true) {
                        val count = input!!.read(buffer)
                        if (count == -1) break
                        total += count
                        require(total <= MAX_APK_BYTES)
                        output.write(buffer, 0, count)
                    }
                    require(total > 0)
                }
                val actualHash = sha256(temporary)
                require(actualHash == policy.sha256)
                val verified = File(updateDirectory, "POLY_PMNA_v${policy.versionName}.apk")
                if (verified.exists()) verified.delete()
                require(temporary.renameTo(verified))
                return verified
            }
            error("Too many update redirects")
        } catch (error: Throwable) {
            temporary.delete()
            throw error
        } finally {
            input?.close()
            connection?.disconnect()
        }
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { input ->
            val buffer = ByteArray(8192)
            while (true) {
                val count = input.read(buffer)
                if (count == -1) break
                digest.update(buffer, 0, count)
            }
        }
        return digest.digest().joinToString("") { byte -> "%02x".format(byte) }
    }

    private fun isTrustedApkHost(host: String?): Boolean {
        return host == "github.com" || host == "release-assets.githubusercontent.com" ||
            host?.endsWith(".githubusercontent.com") == true
    }

    private fun dismissDialog() {
        dialog?.let { if (it.isShowing) it.dismiss() }
        dialog = null
    }

    private fun fetchPolicy(): Policy {
        val uri = URI(manifestUrl)
        require(uri.scheme == "https" && uri.host == TRUSTED_MANIFEST_HOST)
        val connection = (URL(manifestUrl).openConnection() as HttpsURLConnection).apply {
            instanceFollowRedirects = false
            connectTimeout = NETWORK_TIMEOUT_MS
            readTimeout = NETWORK_TIMEOUT_MS
            requestMethod = "GET"
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Cache-Control", "no-cache")
        }
        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK)
            require(connection.contentType?.lowercase()?.startsWith("application/json") == true)
            val payload = connection.inputStream.use { readLimited(it, MAX_MANIFEST_BYTES) }
            return parsePolicy(JSONObject(payload.toString(Charsets.UTF_8)))
        } finally {
            connection.disconnect()
        }
    }

    private fun parsePolicy(json: JSONObject): Policy {
        val versionCode = json.optInt("versionCode", -1)
        val versionName = json.optString("versionName", "")
        val forceUpdate = json.optBoolean("forceUpdate", false)
        val apkUrl = json.optString("apkUrl", "")
        val sha256 = json.optString("sha256", "").lowercase()
        require(versionCode > 0)
        require(versionName.matches(Regex("[0-9]+\\.[0-9]+(?:\\.[0-9]+)?")))
        require(sha256.matches(Regex("[0-9a-f]{64}")))
        require(isTrustedApkUrl(apkUrl))
        return Policy(
            versionCode = versionCode,
            versionName = versionName,
            forceUpdate = forceUpdate,
            apkUrl = apkUrl,
            sha256 = sha256,
            mustUpdate = forceUpdate && versionCode > BuildConfig.VERSION_CODE,
        )
    }

    private fun isTrustedApkUrl(value: String): Boolean {
        val uri = runCatching { URI(value) }.getOrNull() ?: return false
        val path = uri.path ?: return false
        return uri.scheme == "https" &&
            uri.host == TRUSTED_APK_HOST &&
            uri.query == null &&
            uri.fragment == null &&
            path.startsWith(TRUSTED_RELEASE_PREFIX) &&
            path.endsWith(".apk")
    }

    private fun readLimited(input: java.io.InputStream, maxBytes: Int): ByteArray {
        val output = ByteArrayOutputStream()
        val buffer = ByteArray(4096)
        var total = 0
        while (true) {
            val count = input.read(buffer)
            if (count == -1) break
            total += count
            require(total <= maxBytes)
            output.write(buffer, 0, count)
        }
        return output.toByteArray()
    }

    private data class Policy(
        val versionCode: Int,
        val versionName: String,
        val forceUpdate: Boolean,
        val apkUrl: String,
        val sha256: String,
        val mustUpdate: Boolean,
    )

    companion object {
        private const val DEFAULT_MANIFEST_URL = "https://polypmna.dpdns.org/downloads/app-update.json"
        private const val TRUSTED_MANIFEST_HOST = "polypmna.dpdns.org"
        private const val TRUSTED_APK_HOST = "github.com"
        private const val TRUSTED_RELEASE_PREFIX = "/nandurpm/diploma-notes/releases/download/"
        private const val NETWORK_TIMEOUT_MS = 8_000
        private const val MAX_MANIFEST_BYTES = 64 * 1024
        private const val MAX_APK_BYTES = 100L * 1024L * 1024L
        private const val MAX_REDIRECTS = 4
        private const val RECHECK_INTERVAL_MS = 15 * 60 * 1000L
    }
}
