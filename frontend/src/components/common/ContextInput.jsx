import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useLogContext } from '../../hooks/useContext';

const ContextInput = ({ onLogged }) => {
  const [text, setText] = useState('');
  const { mutate: logContext, isPending: isLoading } = useLogContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    logContext(text, {
      onSuccess: () => {
        setText('');
        if (onLogged) onLogged();
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form 
        onSubmit={handleSubmit}
        className="relative group transition-all duration-300"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening?"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                     transition-all duration-300 placeholder:text-gray-400 text-gray-700 text-lg
                     group-hover:shadow-md disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl
                     text-indigo-600 hover:bg-indigo-50 disabled:text-gray-300 
                     disabled:hover:bg-transparent transition-colors duration-200"
        >
          <Send size={24} className={isLoading ? 'animate-pulse' : ''} />
        </button>
      </form>
      <div className="mt-2 ml-6 text-xs text-gray-400 font-medium tracking-wide uppercase">
        NARI Context Stream — frictionless daily logging
      </div>
    </div>
  );
};

export default ContextInput;
