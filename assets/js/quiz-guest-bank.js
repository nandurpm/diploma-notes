/* Purpose: Quiz guest bank - Descriptive comment added for clarity */
(() => {
  "use strict";

  const files = ["1001", "1002", "1003", "1004", "2001", "2002", "2003", "gk"].map(
    (code) => `/assets/js/quiz-bank-${code}.js?v=20260619-pdfbank`
  );

  function hash(text) {
    let value = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function randomFrom(seed) {
    return () => {
      seed += 0x6d2b79f5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, random) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [output[index], output[target]] = [output[target], output[index]];
    }
    return output;
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${url}`));
      document.head.append(script);
    });
  }

  window.QuizGuestBankReady = files.reduce(
    (promise, file) => promise.then(() => loadScript(file)),
    Promise.resolve()
  ).then(() => {
    const sources = window.QuizGuestSubjects || {};
    const subjectMeta = Object.fromEntries(
      Object.entries(sources).map(([code, subject]) => [code, {
        code,
        title: subject.title,
        subtitle: subject.subtitle,
        icon: subject.icon,
        description: subject.description,
        color: subject.color,
      }])
    );

    if (window.PolyQuiz?.subjects) {
      Object.assign(window.PolyQuiz.subjects, subjectMeta);
    }

    function selectedQuestions(subjectCode, dateKey, mode) {
      const subject = sources[subjectCode];
      if (!subject) throw new Error("Unknown quiz subject.");

      const daily = shuffle(
        subject.questions,
        randomFrom(hash(`${subjectCode}-${dateKey}-daily`))
      ).slice(0, 10);

      return daily.map((question) => ({
        ...question,
        options: shuffle(
          question.options,
          randomFrom(hash(`${subjectCode}-${dateKey}-${question.id}-${mode}`))
        ),
      }));
    }

    window.QuizGuestBank = {
      subjects: subjectMeta,
      questions: selectedQuestions,
      grade(subjectCode, dateKey, mode, answers) {
        const selected = selectedQuestions(subjectCode, dateKey, mode);
        const review = selected.map((question, index) => ({
          number: index + 1,
          id: question.id,
          topic: question.topic,
          question: question.question,
          userAnswer: answers[String(question.id)] ?? "Not answered",
          correctAnswer: question.answer,
        }));
        return {
          score: review.filter(
            (item) => item.userAnswer === item.correctAnswer
          ).length,
          review,
        };
      },
    };

    return window.QuizGuestBank;
  });
})();
