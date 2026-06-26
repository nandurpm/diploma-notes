try {
  if (typeof SUBJECTS !== 'undefined' && Array.isArray(SUBJECTS)) {
    window.SUBJECTS = SUBJECTS;
  }
} catch (error) {
  console.warn('Subject data bridge unavailable', error);
}
