// Syllabus structure. Business Economics = Paper 4, Section A (objective / MCQ).
// NOTE: Verify unit titles against the ICAI study material applicable to your attempt.
module.exports = {
  exam: 'CA Foundation – January 2027',
  negativeMarking: 0.25, // per wrong MCQ, objective papers (Paper 3 & 4) – verify on icai.org
  minutesPerMark: 1.8,   // 180 minutes / 100 marks
  subjects: [
    { id: 'accounting', name: 'Principles & Practice of Accounting', paper: 1, available: false },
    { id: 'laws', name: 'Business Laws', paper: 2, available: false },
    { id: 'quant', name: 'Business Mathematics, Logical Reasoning & Statistics', paper: 3, available: false },
    {
      id: 'economics', name: 'Business Economics', paper: 4, available: true,
      chapters: [
        { id: 1, name: 'Nature and Scope of Business Economics', weight: 0.15 },
        { id: 2, name: 'Theory of Demand and Supply', weight: 0.30 },
        { id: 3, name: 'Theory of Production and Cost', weight: 0.25 },
        { id: 4, name: 'Price Determination in Different Markets', weight: 0.22 },
        { id: 5, name: 'Business Cycles', weight: 0.08 }
      ]
    }
  ]
};
