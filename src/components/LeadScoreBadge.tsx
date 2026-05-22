// Lead Score Badge Component
import React from 'react';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface LeadScoreBadgeProps {
  score?: number;
  scoreLevel?: 'High' | 'Medium' | 'Low';
  churnRisk?: number;
  size?: 'sm' | 'md' | 'lg';
  showChurn?: boolean;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ 
  score = 0, 
  scoreLevel = 'Low',
  churnRisk = 0,
  size = 'md',
  showChurn = false
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const scoreColors = {
    High: 'bg-green-100 text-green-800 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const churnColors = {
    High: 'bg-red-100 text-red-800 border-red-300',
    Medium: 'bg-orange-100 text-orange-800 border-orange-300',
    Low: 'bg-green-100 text-green-800 border-green-300'
  };

  const getChurnLevel = (risk: number) => {
    if (risk > 70) return 'High';
    if (risk > 40) return 'Medium';
    return 'Low';
  };

  const churnLevel = getChurnLevel(churnRisk);

  return (
    <div className="flex items-center gap-2">
      {/* Lead Score Badge */}
      <div 
        className={`inline-flex items-center gap-1 border rounded-full font-semibold ${sizeClasses[size]} ${scoreColors[scoreLevel]}`}
        title={`Lead Score: ${score}/100`}
      >
        <Target className="w-3 h-3" />
        <span>{score}</span>
      </div>

      {/* Churn Risk Badge */}
      {showChurn && churnRisk > 40 && (
        <div 
          className={`inline-flex items-center gap-1 border rounded-full font-semibold ${sizeClasses[size]} ${churnColors[churnLevel]}`}
          title={`Churn Risk: ${churnRisk}%`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>{churnRisk}%</span>
        </div>
      )}
    </div>
  );
};

// Lead Score Detailed Card
interface LeadScoreCardProps {
  leadId: string;
  score?: number;
  scoreLevel?: 'High' | 'Medium' | 'Low';
  breakdown?: {
    engagement: number;
    recency: number;
    source: number;
    profile: number;
    behavioral: number;
  };
  churnRisk?: number;
  churnLevel?: 'High' | 'Medium' | 'Low';
  recommendations?: string[];
  nextAction?: {
    action: string;
    priority: string;
    reason: string;
    suggestedTime: string;
  };
}

export const LeadScoreCard: React.FC<LeadScoreCardProps> = ({
  leadId,
  score = 0,
  scoreLevel = 'Low',
  breakdown,
  churnRisk = 0,
  churnLevel = 'Low',
  recommendations = [],
  nextAction
}) => {
  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-600';
  const churnColor = churnRisk > 70 ? 'text-red-600' : churnRisk > 40 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lead Intelligence</h3>
        <LeadScoreBadge score={score} scoreLevel={scoreLevel} churnRisk={churnRisk} showChurn />
      </div>

      {/* Score Breakdown */}
      {breakdown && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Score Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <span className="text-xs text-gray-600 w-24 capitalize">{key}:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(value / 30) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-700 ml-2 w-8 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn Risk */}
      {churnRisk > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Churn Risk</span>
            <span className={`text-lg font-bold ${churnColor}`}>{churnRisk}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                churnRisk > 70 ? 'bg-red-500' : churnRisk > 40 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${churnRisk}%` }}
            />
          </div>
        </div>
      )}

      {/* Next Best Action */}
      {nextAction && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Recommended Action
          </h4>
          <p className="text-sm text-blue-800 font-medium mb-1">{nextAction.action}</p>
          <p className="text-xs text-blue-700">{nextAction.reason}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              nextAction.priority === 'High' ? 'bg-red-100 text-red-800' :
              nextAction.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {nextAction.priority} Priority
            </span>
            <span className="text-xs text-blue-700">⏰ {nextAction.suggestedTime}</span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LeadScoreBadge;
