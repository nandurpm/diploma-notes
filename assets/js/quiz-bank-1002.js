/* Purpose: Quiz bank 1002 - Descriptive comment added for clarity */
(() => {
  "use strict";
  window.QuizGuestSubjects = window.QuizGuestSubjects || {};
  window.QuizGuestSubjects["1002"] = {
    title: "Maths Quiz",
    subtitle: "Fundamentals of Engineering Mathematics · Course Code 1002",
    icon: "Σ",
    description: "Practice algebra, logarithms, trigonometry, limits, differentiation, integration, and matrices.",
    color: "#2563eb",
    questions: [
      { id: 1, topic: "Algebra", question: "If log (x) to base 2 = 5, then x is _____", answer: "32", options: ["32", "10", "25", "2.5"] },
      { id: 2, topic: "Trigonometry", question: "The value of sin²(θ) + cos²(θ) is _____", answer: "1", options: ["1", "0", "-1", "2"] },
      { id: 3, topic: "Matrices", question: "A square matrix A is symmetric if _____", answer: "Aᵀ = A", options: ["Aᵀ = A", "Aᵀ = -A", "Det(A) = 0", "A⁻¹ = A"] },
      { id: 4, topic: "Complex Numbers", question: "What is the amplitude of 1 + i?", answer: "π/4", options: ["π/4", "π/2", "π/3", "π/6"] },
      { id: 5, topic: "Limits", question: "Evaluate the limit: lim (x→3) (x² - 9) / (x - 3)", answer: "6", options: ["6", "0", "3", "Does not exist"] },
      { id: 6, topic: "Calculus", question: "What is the derivative of sin(x) with respect to x?", answer: "cos(x)", options: ["cos(x)", "-cos(x)", "sec²(x)", "tan(x)"] },
      { id: 7, topic: "Complex Numbers", question: "What is the conjugate of the complex number 2 - 3i?", answer: "2 + 3i", options: ["2 + 3i", "-2 + 3i", "-2 - 3i", "3 - 2i"] },
      { id: 8, topic: "Straight Lines", question: "Find the slope of a line perpendicular to y = 2x + 1.", answer: "-1/2", options: ["-1/2", "2", "-2", "1/2"] },
      { id: 9, topic: "Integration", question: "The integral of e^x with respect to x is _____", answer: "e^x + C", options: ["e^x + C", "e^-x + C", "xe^(x-1) + C", "1/e^x + C"] },
      { id: 10, topic: "Cramer's Rule", question: "Cramer's rule is used to solve systems of _____", answer: "linear equations", options: ["linear equations", "quadratic equations", "differential equations", "integral equations"] },
      { id: 11, topic: "Complex Numbers", question: "What is i squared equal to?", answer: "-1", options: ["-1", "1", "i", "0"] },
      { id: 12, topic: "Complex Numbers", question: "For z = a + ib, the real part is what?", answer: "a", options: ["a", "b", "ib", "a + b"] },
      { id: 13, topic: "Straight Lines", question: "Which is the slope-intercept form of a straight line?", answer: "y = mx + c", options: ["y = mx + c", "x squared + y squared = r squared", "ax squared + bx + c = 0", "xy = c"] },
      { id: 14, topic: "Straight Lines", question: "In y = mx + c, m represents what?", answer: "Slope", options: ["Slope", "y-intercept", "x-coordinate", "Radius"] },
      { id: 15, topic: "Straight Lines", question: "The intercept form of a straight line is which one?", answer: "x/a + y/b = 1", options: ["x/a + y/b = 1", "y = mx + c", "y - y1 = m(x - x1)", "x = constant only"] },
      { id: 16, topic: "Angles", question: "180 degrees is equal to how many radians?", answer: "pi radians", options: ["pi radians", "2pi radians", "pi/2 radians", "1 radian"] },
      { id: 17, topic: "Trigonometric Ratios", question: "sin 90 degrees is equal to what?", answer: "1", options: ["1", "0", "1/2", "sqrt(3)/2"] },
      { id: 18, topic: "Trigonometric Ratios", question: "cos 0 degrees is equal to what?", answer: "1", options: ["1", "0", "1/2", "-1"] },
      { id: 19, topic: "Identities", question: "Which identity is correct?", answer: "sin squared theta + cos squared theta = 1", options: ["sin squared theta + cos squared theta = 1", "sin theta + cos theta = 1", "tan theta = cos theta / sin theta", "sec theta = sin theta"] },
      { id: 20, topic: "Compound Angles", question: "sin(A + B) equals what?", answer: "sinA cosB + cosA sinB", options: ["sinA cosB + cosA sinB", "sinA cosB - cosA sinB", "cosA cosB - sinA sinB", "tanA + tanB"] },
      { id: 21, topic: "Compound Angles", question: "cos(A + B) equals what?", answer: "cosA cosB - sinA sinB", options: ["cosA cosB - sinA sinB", "cosA cosB + sinA sinB", "sinA cosB + cosA sinB", "tanA tanB"] },
      { id: 22, topic: "Double Angles", question: "sin 2A is equal to what?", answer: "2 sinA cosA", options: ["2 sinA cosA", "sin squared A - cos squared A", "1 - tan squared A", "cos squared A + sin squared A"] },
      { id: 23, topic: "Limits", question: "lim x tends to 0 of sin x / x, where x is in radians, equals what?", answer: "1", options: ["1", "0", "infinity", "-1"] },
      { id: 24, topic: "Differentiation", question: "d/dx of x power n is what?", answer: "n x power n-1", options: ["n x power n-1", "x power n+1", "n x power n", "x/n"] },
      { id: 25, topic: "Differentiation", question: "The derivative of a constant is what?", answer: "0", options: ["0", "1", "The constant", "x"] },
      { id: 26, topic: "Differentiation", question: "The product rule is used to differentiate which type of expression?", answer: "Product of two functions", options: ["Product of two functions", "Only constants", "Only straight lines", "Only angles"] },
      { id: 27, topic: "Differentiation", question: "d/dx of log x is what?", answer: "1/x", options: ["1/x", "x", "log x", "e power x"] },
      { id: 28, topic: "Implicit Differentiation", question: "When x and y are connected in one equation, dy/dx is usually found by which method?", answer: "Implicit differentiation", options: ["Implicit differentiation", "Matrix multiplication", "Electrolysis", "Vector product"] },
      { id: 29, topic: "Coordinate Geometry", question: "The distance formula is mainly used to find distance between what?", answer: "Two points", options: ["Two points", "Two resistors", "Two ions", "Two waves"] },
      { id: 30, topic: "Differentiation", question: "The quotient rule is used when one function is divided by what?", answer: "Another function", options: ["Another function", "A unit vector only", "A conductor", "A lens"] }
    ]
  };
})();
