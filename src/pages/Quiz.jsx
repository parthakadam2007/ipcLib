import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { saveQuizScore, getQuizHistory } from '../utils/storage';

export const Quiz = ({ onExploreLab }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // 'all' | 'beginner' | 'intermediate' | 'advanced'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [quizHistory, setQuizHistory] = useState(getQuizHistory());

  const filteredQuestions = selectedDifficulty === 'all'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter((q) => q.difficulty === selectedDifficulty);

  const activeQuestion = filteredQuestions[currentIdx];

  const handleSelectOption = (optIdx) => {
    if (isAnswered) return;
    setSelectedOption(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === activeQuestion.answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < filteredQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const finalScore = selectedOption === activeQuestion.answer ? score : score;
      saveQuizScore(`quiz-${selectedDifficulty}`, finalScore, filteredQuestions.length);
      setQuizHistory(getQuizHistory());

      if (finalScore / filteredQuestions.length >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleRestart = (diff = selectedDifficulty) => {
    setSelectedDifficulty(diff);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              IPC & Synchronization Knowledge Assessment
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Validate your understanding of system calls, concurrency, memory models, and deadlock
            </p>
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 bg-dark-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleRestart(lvl)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                selectedDifficulty === lvl
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Quiz Body */}
      {!isFinished ? (
        activeQuestion && (
          <div className="rounded-2xl border border-slate-800 bg-dark-900/90 p-6 shadow-xl space-y-6">
            {/* Progress bar and question metadata */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-bold text-[10px]">
                  {activeQuestion.difficulty}
                </span>
                <span className="text-slate-300">Category: {activeQuestion.category}</span>
              </div>
              <div className="font-bold text-slate-200">
                Question {currentIdx + 1} of {filteredQuestions.length}
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-bold text-white leading-relaxed font-sans">
              {activeQuestion.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuestion.answer;

                let btnStyle = 'bg-dark-950/80 border-slate-800 text-slate-200 hover:border-slate-700';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 font-bold';
                  } else {
                    btnStyle = 'bg-dark-950/40 border-slate-900 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-sans flex items-center justify-between transition-all ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-dark-900 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation card upon answering */}
            {isAnswered && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono space-y-1">
                <span className="font-bold text-cyan-300 block">Explanation:</span>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {activeQuestion.explanation}
                </p>
              </div>
            )}

            {/* Bottom action button */}
            {isAnswered && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md glow-cyan flex items-center gap-2"
                >
                  <span>{currentIdx + 1 === filteredQuestions.length ? 'View Final Results' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* Results Card */
        <div className="rounded-2xl border border-slate-800 bg-dark-900/90 p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg glow-cyan">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white tracking-wide">
              Assessment Completed!
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Level: <span className="uppercase text-cyan-300 font-bold">{selectedDifficulty}</span>
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-dark-950 border border-slate-800 max-w-sm mx-auto font-mono">
            <div className="text-4xl font-black text-cyan-400 mb-1">
              {score} / {filteredQuestions.length}
            </div>
            <div className="text-xs text-slate-400">
              Score: {Math.round((score / filteredQuestions.length) * 100)}%
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleRestart(selectedDifficulty)}
              className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>

            {onExploreLab && (
              <button
                onClick={onExploreLab}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold shadow-md glow-cyan transition-all"
              >
                Return to Simulator Lab
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
