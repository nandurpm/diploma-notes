(() => {
  "use strict";

  const MODEL_QP_BASE = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses&prog=";
  const MATERIALS_2015 = {
    firstYear: [
      { label: "Text Books", url: "https://drive.google.com/folderview?id=1VEew2WIrFxMTDlnW0dBN4Xqgf1RbL-3K" },
      { label: "Basics", url: "https://drive.google.com/folderview?id=1Dr4oLoVyrYIIlMDkNdJ-UJwTTNL9c3_l" },
      { label: "Chemistry", url: "https://drive.google.com/folderview?id=1DQHjhtlOrATnUC4-JDC5Yhf-56tiW7aW" },
      { label: "Physics", url: "https://drive.google.com/folderview?id=1DR2FFJANWHFtDYQxo9hDhv8bZtNOTLY4" },
      { label: "Mathematics", url: "https://drive.google.com/folderview?id=1DVBNFb8aC5eQMXvY2XDOdNEt3h1cO2rB" },
      { label: "Engineering Graphics", url: "https://drive.google.com/folderview?id=1TXGnpAtXZ6q6d_mKiKUaECVPvYZVTlHA" },
      { label: "English", url: "https://drive.google.com/folderview?id=1Dp0etmpdHf3ZmiNXJII13I_o5RQvQWdH" }
    ],

    departments: [
      { label: "Computer Engineering", url: "https://drive.google.com/folderview?id=1y2R20N2GZsKnUEf5z0hHHyHHjrkCflRO" },
      { label: "Automobile Engineering", url: "https://drive.google.com/open?id=1xxhQxogYOZbK_P2N7Vq1fHpqNtT0Qlvt" },
      { label: "Electronics Engineering", url: "https://drive.google.com/drive/folders/1F-RZg7Msl1fNQ43EftNpFj2Iy7K3liPw?usp=sharing" },
      { label: "Electronics & Communication Engineering", url: "https://drive.google.com/open?id=1MOT4kkGx3l6aqdobqkoKHqD1d2Ki6gHx" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=1ke48IQLpf9D55_tXI-9Dxuqg0uJVvfeu" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1XBm0x7wCvPWpIBn0tw9fDriqXvVeMQFE" },
      { label: "Civil Engineering", url: "https://drive.google.com/open?id=1gMZvh6x-lNtYhFvUIfFgOz-kZt81q5Dv" }
    ],

    studyMaterials: [
      { label: "Workshop Material", url: "https://drive.google.com/drive/u/0/mobile/folders/1-2gRIIqomlp6-OLYjTeJKaoVAZBzV8Lb" },
      { label: "Lab Manual — CE / EE / EL / ME", url: "https://drive.google.com/folderview?id=18Jp0qjhH-Oe_vKrMCbkeMPcwjEWwSqYH" },
      { label: "Workshop Materials Archive", url: "https://drive.google.com/drive/folders/18K8CJwFQU-iHH6z8Wc0hiPEba39sKRNl" }
    ],

    questionPapers: [
      { label: "Official REV2015 Model Question Paper Index", url: "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2015" },
      { label: "Architecture — Official Model Papers (AR)", url: MODEL_QP_BASE + "AR" },
      { label: "Automobile Engineering — Official Model Papers (AU)", url: MODEL_QP_BASE + "AU" },
      { label: "Biomedical Engineering — Official Model Papers (BM)", url: MODEL_QP_BASE + "BM" },
      { label: "Computer Application & Business Management — Official Model Papers (CB)", url: MODEL_QP_BASE + "CB" },
      { label: "Civil Engineering — Official Model Papers (CE)", url: MODEL_QP_BASE + "CE" },
      { label: "Chemical Engineering — Official Model Papers (CH)", url: MODEL_QP_BASE + "CH" },
      { label: "Computer Hardware Engineering — Official Model Papers (CM)", url: MODEL_QP_BASE + "CM" },
      { label: "Commercial Practice — Official Model Papers (CP)", url: MODEL_QP_BASE + "CP" },
      { label: "Computer Engineering — Official Model Papers (CT)", url: MODEL_QP_BASE + "CT" },
      { label: "Electronics and Communication — Official Model Papers (EC)", url: MODEL_QP_BASE + "EC" },
      { label: "Electrical & Electronics Engineering — Official Model Papers (EE)", url: MODEL_QP_BASE + "EE" },
      { label: "Electronics Engineering — Official Model Papers (EL)", url: MODEL_QP_BASE + "EL" },
      { label: "Instrumentation Engineering — Official Model Papers (IE)", url: MODEL_QP_BASE + "IE" },
      { label: "Information Technology — Official Model Papers (IF)", url: MODEL_QP_BASE + "IF" },
      { label: "Mechanical Engineering — Official Model Papers (ME)", url: MODEL_QP_BASE + "ME" },
      { label: "Manufacturing Technology — Official Model Papers (MT)", url: MODEL_QP_BASE + "MT" },
      { label: "Polymer Technology — Official Model Papers (PL)", url: MODEL_QP_BASE + "PL" },
      { label: "Printing Technology — Official Model Papers (PT)", url: MODEL_QP_BASE + "PT" },
      { label: "Tool & Die Engineering — Official Model Papers (TD)", url: MODEL_QP_BASE + "TD" },
      { label: "Textile Technology — Official Model Papers (TT)", url: MODEL_QP_BASE + "TT" },
      { label: "Wood and Paper Technology — Official Model Papers (WP)", url: MODEL_QP_BASE + "WP" },
      { label: "Archived Question Paper Availability Index", url: "https://drive.google.com/file/d/1pgfggWTCouquaTPglpK4FfgLTC_9bdYq/view?usp=drivesdk" },
      { label: "Archived First Year Question Papers", url: "https://drive.google.com/open?id=1vHbZ0D-QOHVMEIbcj5FLSHbD_UOWB0LQ" }
    ],

    alternativeNotes: [
      { label: "First Year", url: "https://drive.google.com/open?id=1qHCYDCt2yg2VToC5RbU78ZGD_TN3EtUZ" },
      { label: "Electronics Engineering", url: "https://drive.google.com/drive/folders/1F-RZg7Msl1fNQ43EftNpFj2Iy7K3liPw?usp=sharing" },
      { label: "Electronics & Communication Engineering", url: "https://drive.google.com/open?id=1MOT4kkGx3l6aqdobqkoKHqD1d2Ki6gHx" },
      { label: "Computer Engineering", url: "https://drive.google.com/open?id=1PT81T6_VLZaC-NTUe0Z5jsXBOVBhyp_l" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=1ke48IQLpf9D55_tXI-9Dxuqg0uJVvfeu" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1XBm0x7wCvPWpIBn0tw9fDriqXvVeMQFE" },
      { label: "Civil Engineering", url: "https://drive.google.com/open?id=1gMZvh6x-lNtYhFvUIfFgOz-kZt81q5Dv" }
    ],

    alternativeQuestionPapers: [
      { label: "First Year", url: "https://drive.google.com/open?id=1vHbZ0D-QOHVMEIbcj5FLSHbD_UOWB0LQ" },
      { label: "Electronics Engineering", url: "https://drive.google.com/folderview?id=1eGnaNHw1zUiuTD0NWQWIGYGZSSFj4q5K" },
      { label: "Electronics and Communication", url: "https://drive.google.com/open?id=1lTvKNz_fSD6k6iRFWydBYbm0rUdYjld1" },
      { label: "Computer Engineering", url: "https://drive.google.com/open?id=1ph0GpEP-fmszjVYshwCMDHmK9TcNf8nj" },
      { label: "Civil Engineering", url: "https://drive.google.com/drive/folders/1GHM5P0MwL2O6OjqJtsDB02_0NM9tW2CR" },
      { label: "Automobile Engineering", url: "https://drive.google.com/open?id=1x2FgAElD2KelFsKQQBoBCTEeeAmuc-_k" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=13R5B2b6HvgKTUh5JczLDPa8Srb1Gjq2K" },
      { label: "Instrumentation Engineering", url: "https://drive.google.com/open?id=1UydN-OkfJK8OnofYPgK3i1fcG2NOYzQC" },
      { label: "Computer Hardware Engineering", url: "https://drive.google.com/open?id=12KwaP_QaN1Z86mEWC2ekfiDMBVDQ_DbC" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1qohQ9WZN3ZNbkuVGnsSIGiB28ROpKqLJ" }
    ],

    alternativeOtherMaterials: [
      { label: "Workshop Materials", url: "https://drive.google.com/drive/folders/18K8CJwFQU-iHH6z8Wc0hiPEba39sKRNl" },
      { label: "Lab Manual — CE / EE / EL / ME", url: "https://drive.google.com/folderview?id=18Jp0qjhH-Oe_vKrMCbkeMPcwjEWwSqYH" }
    ]
  };

  globalThis.MATERIALS_2015 = MATERIALS_2015;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function renderGroup(container) {
    const groupName = container.dataset.linkGroup || "";
    const items = Array.isArray(MATERIALS_2015[groupName]) ? MATERIALS_2015[groupName] : [];
    const valid = items
      .map(item => ({ label: String(item?.label || "").trim(), url: safeExternalUrl(item?.url) }))
      .filter(item => item.label && item.url);

    if (!valid.length) {
      container.innerHTML = '<p class="material-link-empty">No verified links are currently listed in this section.</p>';
      return;
    }

    container.innerHTML = valid.map(item => (
      `<a class="material-resource-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">` +
        `<span>${escapeHtml(item.label)}</span><span aria-hidden="true">↗</span>` +
      `</a>`
    )).join("");

    const card = container.closest(".info-card");
    const heading = card?.querySelector("h3");
    if (heading && !heading.querySelector(".material-count")) {
      const count = document.createElement("small");
      count.className = "material-count";
      count.textContent = `${valid.length} link${valid.length === 1 ? "" : "s"}`;
      heading.append(" ", count);
    }
  }

  function renderAll() {
    document.querySelectorAll("[data-link-group]").forEach(renderGroup);
    document.documentElement.classList.add("materials-2015-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderAll, { once: true });
  else renderAll();
})();
