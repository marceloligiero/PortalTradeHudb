import React from 'react';
import { AlertTriangle, BookOpen, Lightbulb, Eye, ClipboardList } from 'lucide-react';

interface ErrorConceptsInputProps {
  methodology: number;
  knowledge: number;
  detail: number;
  procedure: number;
  onChange: (field: 'methodology' | 'knowledge' | 'detail' | 'procedure', value: number) => void;
  readOnly?: boolean;
  showTotal?: boolean;
}

const ErrorConceptsInput: React.FC<ErrorConceptsInputProps> = ({
  methodology,
  knowledge,
  detail,
  procedure,
  onChange,
  readOnly = false,
  showTotal = true
}) => {
  const concepts = [
    {
      key: 'methodology' as const,
      label: 'Metodologia',
      description: 'Erros na forma/método de execução',
      icon: ClipboardList,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      value: methodology
    },
    {
      key: 'knowledge' as const,
      label: 'Conhecimento',
      description: 'Erros por falta de conhecimento',
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      value: knowledge
    },
    {
      key: 'detail' as const,
      label: 'Detalhe',
      description: 'Erros de atenção ao detalhe',
      icon: Eye,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      value: detail
    },
    {
      key: 'procedure' as const,
      label: 'Procedimento',
      description: 'Erros no procedimento/sequência',
      icon: Lightbulb,
      color: 'text-green-600 bg-green-50 border-green-200',
      value: procedure
    }
  ];

  const total = methodology + knowledge + detail + procedure;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Erros por Conceito
        </h3>
        {showTotal && (
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
            total === 0 ? 'bg-green-100 text-green-700' :
            total <= 3 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            Total: {total}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {concepts.map(concept => {
          const IconComponent = concept.icon;
          return (
            <div 
              key={concept.key}
              className={`p-3 rounded-lg border ${concept.color}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="w-4 h-4" />
                <span className="font-medium text-sm">{concept.label}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {concept.description}
              </p>
              {readOnly ? (
                <div className="text-2xl font-bold">
                  {concept.value}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange(concept.key, Math.max(0, concept.value - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 font-bold"
                    disabled={concept.value <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={concept.value}
                    onChange={(e) => onChange(concept.key, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center border rounded-lg py-1 text-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => onChange(concept.key, concept.value + 1)}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100 font-bold"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ErrorConceptsDisplayProps {
  methodology: number;
  knowledge: number;
  detail: number;
  procedure: number;
  maxErrors?: number;
}

export const ErrorConceptsDisplay: React.FC<ErrorConceptsDisplayProps> = ({
  methodology,
  knowledge,
  detail,
  procedure,
  maxErrors
}) => {
  const total = methodology + knowledge + detail + procedure;
  const isOverLimit = maxErrors !== undefined && total > maxErrors;

  const concepts = [
    { label: 'Metodologia', value: methodology, color: 'text-purple-600' },
    { label: 'Conhecimento', value: knowledge, color: 'text-blue-600' },
    { label: 'Detalhe', value: detail, color: 'text-amber-600' },
    { label: 'Procedimento', value: procedure, color: 'text-green-600' }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Erros por Conceito
        </span>
        <span className={`px-2 py-1 rounded-full text-sm font-bold ${
          isOverLimit ? 'bg-red-100 text-red-700' :
          total === 0 ? 'bg-green-100 text-green-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {total} {maxErrors !== undefined && `/ ${maxErrors} max`}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {concepts.map(concept => (
          <div 
            key={concept.label}
            className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg"
          >
            <div className={`text-xl font-bold ${concept.color}`}>
              {concept.value}
            </div>
            <div className="text-xs text-gray-500">
              {concept.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorConceptsInput;
