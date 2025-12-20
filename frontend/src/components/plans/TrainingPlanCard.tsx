import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Clock, ArrowRight } from 'lucide-react';

interface PlanCardProps {
  plan: any;
}

export default function TrainingPlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate();

  const start = plan.start_date ? new Date(plan.start_date) : null;
  const end = plan.end_date ? new Date(plan.end_date) : null;
  const today = new Date();

  let status = 'UNKNOWN';
  let daysRemaining: number | null = null;
  if (start && end) {
    if (today < start) status = 'UPCOMING';
    else if (today > end) status = 'COMPLETED';
    else status = 'ONGOING';
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? diff : 0;
  }

  return (
    <div
      onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-white/3 to-white/6 border border-white/6">
        {/* Left accent + content */}
        <div className="flex">
          <div className="w-2 bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400" />

          <div className="flex-1 p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-snug truncate">{plan.title}</h3>
                <p className="mt-2 text-sm text-slate-300 line-clamp-2">{plan.description}</p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'ONGOING' ? 'bg-emerald-500 text-white' : status === 'UPCOMING' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-white'}`}>
                  {status.toLowerCase()}
                </div>
                <div className="mt-2 text-xs text-slate-400">{plan.total_duration_hours}h</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <div>{plan.total_courses} {plan.total_courses === 1 ? 'curso' : 'cursos'}</div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                import React from 'react';
                import { useNavigate } from 'react-router-dom';
                import './TrainingPlanCard.css';
                import { ArrowRight } from 'lucide-react';

                interface PlanCardProps {
                  plan: any;
                }

                export default function TrainingPlanCard({ plan }: PlanCardProps) {
                  const navigate = useNavigate();

                  const start = plan.start_date ? new Date(plan.start_date) : null;
                  const end = plan.end_date ? new Date(plan.end_date) : null;

                  const getAcronym = (s: string | number | undefined) => {
                    if (!s) return '-';
                    const str = String(s);
                    return str.length > 3 ? String(str).slice(0, 3).toUpperCase() : str.toUpperCase();
                  };

                  return (
                    <div className="container-cards-ticket" onClick={() => navigate(`/trainer/training-plan/${plan.id}`)}>
                      <div className="card-ticket">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="64"
                          height="150"
                          viewBox="0 0 64 150"
                          fill="currentColor"
                          style={{ color: '#c7c7c7' }}
                        >
                          <path d="M44 138V136.967H20V138H44Z"></path>
                          <path d="M44 13.0328V12H20V13.0328H44Z"></path>
                          <path d="M44 14.0656V13.5492H20V14.0656H44Z"></path>
                          <path d="M44 15.6148V15.0984H20V15.6148H44Z"></path>
                          <path d="M44 18.1967V17.6803H20V18.1967H44Z"></path>
                          <path d="M44 20.2623V19.2295H20V20.2623H44Z"></path>
                          <path d="M44 22.8443V22.3279H20V22.8443H44Z"></path>
                        </svg>

                        <div className="separator">
                          <span className="span-lines"></span>
                        </div>

                        <div className="content-ticket">
                          <div className="content-data">
                            <div className="destination">
                              <div className="dest start">
                                <p className="country">{plan.title ?? 'Plano'}</p>
                                <p className="acronym">{getAcronym(plan.id)}</p>
                                <p className="hour">{start ? start.toLocaleDateString() : '-'}</p>
                              </div>

                              <svg style={{ flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path fill="none" stroke="#aeaeae" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="m18 8l4 4l-4 4M2 12h20" />
                              </svg>

                              <div className="dest end">
                                <p className="country">{plan.trainer_name ?? '---'}</p>
                                <p className="acronym">{getAcronym(plan.total_duration_hours)}</p>
                                <p className="hour">{end ? end.toLocaleDateString() : '-'}</p>
                              </div>
                            </div>

                            <div style={{ borderBottom: '2px solid #e8e8e8' }}></div>

                            <div className="data-flex-col">
                              <div className="data-flex">
                                <div className="data">
                                  <p className="title">ID</p>
                                  <p className="subtitle">{plan.id}</p>
                                </div>
                                <div className="data passenger">
                                  <p className="title">Trainer</p>
                                  <p className="subtitle">{plan.trainer_name ?? '-'}</p>
                                </div>
                              </div>

                              <div className="data-flex">
                                <div className="data">
                                  <p className="title">Cursos</p>
                                  <p className="subtitle">{plan.total_courses ?? 0}</p>
                                </div>
                                <div className="data">
                                  <p className="title">Duração</p>
                                  <p className="subtitle">{plan.total_duration_hours ?? '-'}h</p>
                                </div>
                                <div className="data">
                                  <p className="title">Alunos</p>
                                  <p className="subtitle">{plan.total_students ?? 0}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="container-icons">
                            <div className="icon plane">
                              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M20.56 3.91c.59.59.59 1.54 0 2.12l-3.89 3.89l2.12 9.19l-1.41 1.42l-3.88-7.43L9.6 17l.36 2.47l-1.07 1.06l-1.76-3.18l-3.19-1.77L5 14.5l2.5.37L11.37 11L3.94 7.09l1.42-1.41l9.19 2.12l3.89-3.89c.56-.58 1.56-.58 2.12 0" />
                              </svg>
                            </div>
                            <div className="icon uiverse">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" height="20" width="20">
                                <path fill="currentColor" d="M38.0481 4.82927C38.0481 2.16214 40.018 0 42.4481 0H51.2391C53.6692 0 55.6391 2.16214 55.6391 4.82927V40.1401C55.6391 48.8912 53.2343 55.6657 48.4248 60.4636C43.6153 65.2277 36.7304 67.6098 27.7701 67.6098C18.8099 67.6098 11.925 65.2953 7.11548 60.6663C2.37183 56.0036 3.8147e-06 49.2967 3.8147e-06 40.5456V4.82927C3.8147e-06 2.16213 1.96995 0 4.4 0H13.2405C15.6705 0 17.6405 2.16214 17.6405 4.82927V39.1265C17.6405 43.7892 18.4805 47.2018 20.1605 49.3642C21.8735 51.5267 24.4759 52.6079 27.9678 52.6079C31.4596 52.6079 34.0127 51.5436 35.6268 49.4149C37.241 47.2863 38.0481 43.8399 38.0481 39.0758V4.82927Z" />
                                <path fill="currentColor" d="M86.9 61.8682C86.9 64.5353 84.9301 66.6975 82.5 66.6975H73.6595C71.2295 66.6975 69.2595 64.5353 69.2595 61.8682V4.82927C69.2595 2.16214 71.2295 0 73.6595 0H82.5C84.9301 0 86.9 2.16214 86.9 4.82927V61.8682Z" />
                                <path fill="currentColor" d="M2.86102e-06 83.2195C2.86102e-06 80.5524 1.96995 78.3902 4.4 78.3902H83.6C86.0301 78.3902 88 80.5524 88 83.2195V89.1707C88 91.8379 86.0301 94 83.6 94H4.4C1.96995 94 0 91.8379 0 89.1707L2.86102e-06 83.2195Z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
