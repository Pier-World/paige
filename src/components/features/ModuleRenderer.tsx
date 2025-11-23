import React from 'react';
import { CheckCircle2, Sparkles, TrendingDown, MessageCircle } from 'lucide-react';
import type { Module } from '../../types/orchestrator';

interface ModuleRendererProps {
  modules: Module[];
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ modules }) => {
  return (
    <div className="space-y-3">
      {modules.map((module, index) => (
        <ModuleCard key={index} module={module} />
      ))}
    </div>
  );
};

const ModuleCard: React.FC<{ module: Module }> = ({ module }) => {
  switch (module.type) {
    case 'flight_options':
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">{module.headline}</h4>
          <div className="space-y-3">
            {module.options.map((option, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'bonus_tip':
      return (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold text-orange-900">Bonus: </span>
              {module.text}
            </p>
          </div>
        </div>
      );

    case 'savings_badge':
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
          <TrendingDown className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">
            Estimated savings: {module.amountText}
          </span>
        </div>
      );

    case 'perk_recommendations':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">{module.headline}</h4>
          <p className="text-sm text-blue-800">
            {module.perkIds.length} perks recommended based on your preferences
          </p>
          {/* TODO: Render actual PerkCard components for these IDs */}
        </div>
      );

    case 'handoff_to_human':
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 mb-1">
              Looping in your concierge
            </p>
            <p className="text-sm text-gray-700 mb-3">{module.message}</p>
            <p className="text-xs text-gray-600">
              You'll receive a {module.channel} message shortly.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
