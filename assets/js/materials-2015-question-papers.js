(() => {
  "use strict";

  const alternativeQuestionPapers = [
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
  ];

  try {
    if (typeof MATERIALS_2015 !== "undefined" && MATERIALS_2015) {
      MATERIALS_2015.alternativeQuestionPapers = alternativeQuestionPapers;
    }
  } catch (error) {
    console.error("Unable to load the 2015 alternative question-paper links.", error);
  }
})();
