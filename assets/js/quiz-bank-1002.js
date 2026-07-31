/* Purpose: Quiz bank 1002 - Descriptive comment added for clarity */
(() => {
  "use strict";
  window.QuizGuestSubjects = window.QuizGuestSubjects || {};
  window.QuizGuestSubjects["1002"] = {
    title: "Maths Quiz",
    subtitle: "Mathematics I · Course Code 1002",
    icon: "Σ",
    description: "Complex numbers, straight lines, trigonometry, limits and differentiation.",
    color: "#2563eb",
    questions: [
      { id: 1, topic: "Complex Numbers", question: "What is the conjugate of 3 - 2i?", answer: "3 + 2i", options: ["3 + 2i", "3 - 2i", "-3 + 2i", "-3 - 2i"] },
      { id: 2, topic: "Complex Numbers", question: "The modulus of 3 + 4i is what?", answer: "5", options: ["5", "7", "1", "25"] },
      { id: 3, topic: "Complex Numbers", question: "What is i squared equal to?", answer: "-1", options: ["-1", "1", "i", "0"] },
      { id: 4, topic: "Complex Numbers", question: "For z = a + ib, the real part is what?", answer: "a", options: ["a", "b", "ib", "a + b"] },
      { id: 5, topic: "Straight Lines", question: "Which is the slope-intercept form of a straight line?", answer: "y = mx + c", options: ["y = mx + c", "x squared + y squared = r squared", "ax squared + bx + c = 0", "xy = c"] },
      { id: 6, topic: "Straight Lines", question: "In y = mx + c, m represents what?", answer: "Slope", options: ["Slope", "x-intercept", "y-coordinate", "Radius"] },
      { id: 7, topic: "Straight Lines", question: "The intercept form of a straight line is which one?", answer: "x/a + y/b = 1", options: ["x/a + y/b = 1", "y = mx + c", "y - y1 = m(x - x1)", "x = constant only"] },
      { id: 8, topic: "Straight Lines", question: "For two parallel non-vertical lines, their slopes are what?", answer: "Equal", options: ["Equal", "Product is -1", "Always zero", "Always undefined"] },
      { id: 9, topic: "Straight Lines", question: "For two perpendicular lines with finite nonzero slopes, m1m2 equals what?", answer: "-1", options: ["-1", "1", "0", "2"] },
      { id: 10, topic: "Angles", question: "180 degrees is equal to how many radians?", answer: "pi radians", options: ["pi radians", "2pi radians", "pi/2 radians", "1 radian"] },
      { id: 11, topic: "Trigonometric Ratios", question: "sin 90 degrees is equal to what?", answer: "1", options: ["1", "0", "1/2", "sqrt(3)/2"] },
      { id: 12, topic: "Trigonometric Ratios", question: "cos 0 degrees is equal to what?", answer: "1", options: ["1", "0", "1/2", "-1"] },
      { id: 13, topic: "Trigonometry", question: "tan theta is equal to what?", answer: "sin theta / cos theta", options: ["sin theta / cos theta", "cos theta / sin theta", "1 / sin theta", "1 / cos theta"] },
      { id: 14, topic: "Identities", question: "Which identity is correct?", answer: "sin squared theta + cos squared theta = 1", options: ["sin squared theta + cos squared theta = 1", "sin theta + cos theta = 1", "tan theta = cos theta / sin theta", "sec theta = sin theta"] },
      { id: 15, topic: "Compound Angles", question: "sin(A + B) equals what?", answer: "sinA cosB + cosA sinB", options: ["sinA cosB + cosA sinB", "sinA cosB - cosA sinB", "cosA cosB - sinA sinB", "tanA + tanB"] },
      { id: 16, topic: "Compound Angles", question: "cos(A + B) equals what?", answer: "cosA cosB - sinA sinB", options: ["cosA cosB - sinA sinB", "cosA cosB + sinA sinB", "sinA cosB + cosA sinB", "tanA tanB"] },
      { id: 17, topic: "Double Angles", question: "sin 2A is equal to what?", answer: "2 sinA cosA", options: ["2 sinA cosA", "sin squared A - cos squared A", "1 - tan squared A", "cos squared A + sin squared A"] },
      { id: 18, topic: "Limits", question: "lim x tends to 0 of sin x / x, where x is in radians, equals what?", answer: "1", options: ["1", "0", "infinity", "-1"] },
      { id: 19, topic: "Limits", question: "A limit of a polynomial at x = a is usually found by which method first?", answer: "Direct substitution", options: ["Direct substitution", "Changing units", "Drawing a circuit", "Finding pH"] },
      { id: 20, topic: "Differentiation", question: "d/dx of x power n is what?", answer: "n x power n-1", options: ["n x power n-1", "x power n+1", "n x power n", "x/n"] },
      { id: 21, topic: "Differentiation", question: "The derivative of a constant is what?", answer: "0", options: ["0", "1", "The constant", "x"] },
      { id: 22, topic: "Differentiation", question: "The product rule is used to differentiate which type of expression?", answer: "Product of two functions", options: ["Product of two functions", "Only constants", "Only straight lines", "Only angles"] },
      { id: 23, topic: "Differentiation", question: "d/dx of log x is what?", answer: "1/x", options: ["1/x", "x", "log x", "e power x"] },
      { id: 24, topic: "Implicit Differentiation", question: "When x and y are connected in one equation, dy/dx is usually found by which method?", answer: "Implicit differentiation", options: ["Implicit differentiation", "Matrix multiplication", "Electrolysis", "Vector product"] },
      { id: 25, topic: "Parametric Differentiation", question: "If x and y are functions of t, dy/dx equals what?", answer: "dy/dt divided by dx/dt", options: ["dy/dt divided by dx/dt", "dx/dt divided by dy/dt", "dx/dt plus dy/dt", "dt/dx"] },
      { id: 26, topic: "Successive Differentiation", question: "The second derivative of y with respect to x is denoted by what?", answer: "d2y/dx2", options: ["d2y/dx2", "dy/dx", "dx/dy", "d2x/dy2"] },
      { id: 27, topic: "Coordinate Geometry", question: "The distance formula is mainly used to find distance between what?", answer: "Two points", options: ["Two points", "Two resistors", "Two ions", "Two waves"] },
      { id: 28, topic: "Straight Lines", question: "The perpendicular distance formula is used to find distance from a point to what?", answer: "A straight line", options: ["A straight line", "A circle centre only", "A matrix", "A vector product"] },
      { id: 29, topic: "Trigonometry", question: "Product-to-sum formulae are part of which module area?", answer: "Trigonometry", options: ["Trigonometry", "Electrochemistry", "Fluid dynamics", "Environmental acts"] },
      { id: 30, topic: "Differentiation", question: "The quotient rule is used when one function is divided by what?", answer: "Another function", options: ["Another function", "A unit vector only", "A conductor", "A lens"] }
    ]
  };
})();
