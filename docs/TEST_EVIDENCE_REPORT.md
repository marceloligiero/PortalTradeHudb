# Relatório de Evidência de Testes - Portal TradeHub

**Data de Execução:** Gerado automaticamente  
**Ambiente:** Python 3.14.2, pytest 7.4.3, FastAPI TestClient  
**Base de Dados:** MySQL 8.4 (`tradehub`) — limpa antes da execução  
**Resultado Global:** ✅ **341 PASSED** | ⏭️ 1 SKIPPED | ⏱️ 11.19s

---

## 1. Resumo Executivo

| Métrica | Valor |
|---|---|
| Total de Testes | 342 |
| Testes PASSED | 341 (99.7%) |
| Testes SKIPPED | 1 (0.3%) |
| Testes FAILED | 0 |
| Endpoints da API | 287 (aplicação) |
| Rotas Totais | 292 (inc. docs/openapi) |
| Roles Testados | 7 (ADMIN, MANAGER, TRAINER, TUTOR, STUDENT, LIBERADOR, REFERENTE) |
| Tempo de Execução | 11.19 segundos |
| Classes de Teste | 35 |

---

## 2. Perfis de Utilizador Testados

| Role | Email de Teste | Flags | Nº Testes |
|---|---|---|---|
| ADMIN | admin@tradehub.com | role=ADMIN | ~120 |
| MANAGER | manager_test@tradehub.com | role=MANAGER, is_team_lead=true | ~12 |
| TRAINER | trainer_test@tradehub.com | role=TRAINER, is_trainer=true | ~55 |
| TUTOR | tutor_test@tradehub.com | role=TRAINEE, is_tutor=true | ~15 |
| STUDENT | student_test@tradehub.com | role=TRAINEE | ~40 |
| LIBERADOR | liberador_test@tradehub.com | role=TRAINEE, is_liberador=true | ~2 |
| REFERENTE | referente_test@tradehub.com | role=TRAINEE, is_referente=true | ~1 |

---

## 3. Evidência por Módulo

### 3.1 Setup & Saúde (9 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestSetup::test_create_all_users | ADMIN | ✅ PASSED |
| 2 | TestSetup::test_verify_all_users_exist | ADMIN | ✅ PASSED |
| 3 | TestHealthAndPublic::test_health | NONE | ✅ PASSED |
| 4 | TestHealthAndPublic::test_api_health | NONE | ✅ PASSED |
| 5 | TestHealthAndPublic::test_api_root | NONE | ✅ PASSED |
| 6 | TestHealthAndPublic::test_public_landing | NONE | ✅ PASSED |
| 7 | TestHealthAndPublic::test_stats_kpis | NONE | ✅ PASSED |
| 8 | TestHealthAndPublic::test_stats_featured_courses | NONE | ✅ PASSED |
| 9 | TestHealthAndPublic::test_stats_featured_plans | NONE | ✅ PASSED |

### 3.2 Autenticação (6 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAuth::test_login_admin | NONE | ✅ PASSED |
| 2 | TestAuth::test_login_wrong_password | NONE | ✅ PASSED |
| 3 | TestAuth::test_me | ADMIN | ✅ PASSED |
| 4 | TestAuth::test_me_unauthenticated | NONE | ✅ PASSED |
| 5 | TestAuth::test_verify_email_exists | NONE | ✅ PASSED |
| 6 | TestAuth::test_verify_email_not_found | NONE | ✅ PASSED |

### 3.3 Admin — Gestão de Utilizadores (6 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdminUsers::test_list_users_admin | ADMIN | ✅ PASSED |
| 2 | TestAdminUsers::test_list_users_manager | MANAGER | ✅ PASSED |
| 3 | TestAdminUsers::test_list_users_student_forbidden | STUDENT | ✅ PASSED |
| 4 | TestAdminUsers::test_get_user_admin | ADMIN | ✅ PASSED |
| 5 | TestAdminUsers::test_update_user_admin | ADMIN | ✅ PASSED |
| 6 | TestAdminUsers::test_pending_trainers | ADMIN | ✅ PASSED |

### 3.4 Admin — Bancos & Produtos (12 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdminBanksProducts::test_create_bank | ADMIN | ✅ PASSED |
| 2 | TestAdminBanksProducts::test_list_banks | ADMIN | ✅ PASSED |
| 3 | TestAdminBanksProducts::test_update_bank | ADMIN | ✅ PASSED |
| 4 | TestAdminBanksProducts::test_create_product | ADMIN | ✅ PASSED |
| 5 | TestAdminBanksProducts::test_list_products | ADMIN | ✅ PASSED |
| 6 | TestAdminBanksProducts::test_update_product | ADMIN | ✅ PASSED |
| 7 | TestAdminBanksProducts::test_banks_trainer_can_list | TRAINER | ✅ PASSED |
| 8 | TestAdminBanksProducts::test_products_trainer_can_list | TRAINER | ✅ PASSED |
| 9 | TestAdminBanksProducts::test_create_bank_student_forbidden | STUDENT | ✅ PASSED |
| 10 | TestAdminBanksProducts::test_create_product_student_forbidden | STUDENT | ✅ PASSED |
| 11 | TestAdminBanksProducts::test_delete_bank | ADMIN | ✅ PASSED |
| 12 | TestAdminBanksProducts::test_delete_product | ADMIN | ✅ PASSED |

### 3.5 Admin — Dados Mestres (30 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdminMasterImpacts::test_create_impact | ADMIN | ✅ PASSED |
| 2 | TestAdminMasterImpacts::test_list_impacts | ADMIN | ✅ PASSED |
| 3 | TestAdminMasterImpacts::test_list_impacts_manager | MANAGER | ✅ PASSED |
| 4 | TestAdminMasterImpacts::test_update_impact | ADMIN | ✅ PASSED |
| 5 | TestAdminMasterImpacts::test_delete_impact | ADMIN | ✅ PASSED |
| 6 | TestAdminMasterImpacts::test_create_impact_student_forbidden | STUDENT | ✅ PASSED |
| 7 | TestAdminMasterOrigins::test_create_origin | ADMIN | ✅ PASSED |
| 8 | TestAdminMasterOrigins::test_list_origins | ADMIN | ✅ PASSED |
| 9 | TestAdminMasterOrigins::test_update_origin | ADMIN | ✅ PASSED |
| 10 | TestAdminMasterOrigins::test_delete_origin | ADMIN | ✅ PASSED |
| 11 | TestAdminMasterDetectedBy::test_create_detected_by | ADMIN | ✅ PASSED |
| 12 | TestAdminMasterDetectedBy::test_list_detected_by | ADMIN | ✅ PASSED |
| 13 | TestAdminMasterDetectedBy::test_update_detected_by | ADMIN | ✅ PASSED |
| 14 | TestAdminMasterDetectedBy::test_delete_detected_by | ADMIN | ✅ PASSED |
| 15 | TestAdminMasterDepartments::test_create_department | ADMIN | ✅ PASSED |
| 16 | TestAdminMasterDepartments::test_list_departments | ADMIN | ✅ PASSED |
| 17 | TestAdminMasterDepartments::test_update_department | ADMIN | ✅ PASSED |
| 18 | TestAdminMasterDepartments::test_delete_department | ADMIN | ✅ PASSED |
| 19 | TestAdminMasterActivities::test_create_activity | ADMIN | ✅ PASSED |
| 20 | TestAdminMasterActivities::test_list_activities | ADMIN | ✅ PASSED |
| 21 | TestAdminMasterActivities::test_update_activity | ADMIN | ✅ PASSED |
| 22 | TestAdminMasterActivities::test_delete_activity | ADMIN | ✅ PASSED |
| 23 | TestAdminMasterActivities::test_filter_activities | ADMIN | ✅ PASSED |
| 24 | TestAdminMasterErrorTypes::test_create_error_type | ADMIN | ✅ PASSED |
| 25 | TestAdminMasterErrorTypes::test_list_error_types | ADMIN | ✅ PASSED |
| 26 | TestAdminMasterErrorTypes::test_update_error_type | ADMIN | ✅ PASSED |
| 27 | TestAdminMasterErrorTypes::test_delete_error_type | ADMIN | ✅ PASSED |
| 28 | TestAdminMasterErrorTypes::test_filter_error_types | ADMIN | ✅ PASSED |
| 29 | TestAdminMasterErrorTypes::test_filter_categories | ADMIN | ✅ PASSED |

### 3.6 Admin — Cursos (7 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdminCourses::test_list_courses | ADMIN | ✅ PASSED |
| 2 | TestAdminCourses::test_create_course | ADMIN | ✅ PASSED |
| 3 | TestAdminCourses::test_get_course | ADMIN | ✅ PASSED |
| 4 | TestAdminCourses::test_update_course | ADMIN | ✅ PASSED |
| 5 | TestAdminCourses::test_delete_course | ADMIN | ✅ PASSED |
| 6 | TestAdminCourses::test_get_lesson_in_course | ADMIN | ⏭️ SKIPPED |
| 7 | TestAdminCourses::test_student_forbidden | STUDENT | ✅ PASSED |

> **Nota:** `test_get_lesson_in_course` é SKIPPED porque depende de ordenação de criação de lições que pode variar.

### 3.7 Admin — Listas & Relatórios (12 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdminListsReports::test_list_students | ADMIN | ✅ PASSED |
| 2 | TestAdminListsReports::test_list_trainers | ADMIN | ✅ PASSED |
| 3 | TestAdminListsReports::test_reports_stats | ADMIN | ✅ PASSED |
| 4 | TestAdminListsReports::test_reports_courses | ADMIN | ✅ PASSED |
| 5 | TestAdminListsReports::test_reports_trainers | ADMIN | ✅ PASSED |
| 6 | TestAdminListsReports::test_reports_training_plans | ADMIN | ✅ PASSED |
| 7 | TestAdminListsReports::test_reports_insights | ADMIN | ✅ PASSED |
| 8 | TestAdminListsReports::test_reports_student_forbidden | STUDENT | ✅ PASSED |
| 9 | TestAdminListsReports::test_validate_trainer | ADMIN | ✅ PASSED |
| 10 | TestAdminListsReports::test_reject_trainer | ADMIN | ✅ PASSED |
| 11 | TestAdminListsReports::test_pending_trainers_list | ADMIN | ✅ PASSED |
| 12 | TestAdminListsReports::test_delete_user | ADMIN | ✅ PASSED |

### 3.8 Formador — Cursos & Lições (21 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTrainerCourses::test_trainer_stats | TRAINER | ✅ PASSED |
| 2 | TestTrainerCourses::test_create_course_trainer | TRAINER | ✅ PASSED |
| 3 | TestTrainerCourses::test_list_courses_trainer | TRAINER | ✅ PASSED |
| 4 | TestTrainerCourses::test_get_course_trainer | TRAINER | ✅ PASSED |
| 5 | TestTrainerCourses::test_list_all_courses | TRAINER | ✅ PASSED |
| 6 | TestTrainerCourses::test_create_lesson | TRAINER | ✅ PASSED |
| 7 | TestTrainerCourses::test_create_lesson_student_forbidden | STUDENT | ✅ PASSED |
| 8 | TestTrainerCourses::test_course_details_with_lessons | TRAINER | ✅ PASSED |
| 9 | TestTrainerCourses::test_admin_list_courses | ADMIN | ✅ PASSED |
| 10 | TestTrainerCourses::test_update_course | TRAINER | ✅ PASSED |
| 11 | TestTrainerCourses::test_delete_course_temp | TRAINER | ✅ PASSED |
| 12 | TestTrainerCourses::test_get_lesson_details | TRAINER | ✅ PASSED |
| 13 | TestTrainerCourses::test_trainer_training_plans | TRAINER | ✅ PASSED |
| 14 | TestTrainerCourses::test_trainer_create_training_plan | TRAINER | ✅ PASSED |
| 15 | TestTrainerCourses::test_trainer_students | TRAINER | ✅ PASSED |
| 16 | TestTrainerCourses::test_trainer_students_list | TRAINER | ✅ PASSED |
| 17 | TestTrainerCourses::test_trainer_reports_overview | TRAINER | ✅ PASSED |
| 18 | TestTrainerCourses::test_trainer_reports_plans | TRAINER | ✅ PASSED |
| 19 | TestTrainerCourses::test_trainer_reports_students | TRAINER | ✅ PASSED |
| 20 | TestTrainerCourses::test_trainer_reports_lessons | TRAINER | ✅ PASSED |
| 21 | TestTrainerCourses::test_trainer_reports_challenges | TRAINER | ✅ PASSED |

### 3.9 Planos de Formação (16 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTrainingPlans::test_create_plan | ADMIN | ✅ PASSED |
| 2 | TestTrainingPlans::test_list_plans_admin | ADMIN | ✅ PASSED |
| 3 | TestTrainingPlans::test_list_plans_trainer | TRAINER | ✅ PASSED |
| 4 | TestTrainingPlans::test_list_plans_student | STUDENT | ✅ PASSED |
| 5 | TestTrainingPlans::test_get_plan | ADMIN | ✅ PASSED |
| 6 | TestTrainingPlans::test_update_plan | ADMIN | ✅ PASSED |
| 7 | TestTrainingPlans::test_add_course_to_plan | ADMIN, TRAINER | ✅ PASSED |
| 8 | TestTrainingPlans::test_assign_student | ADMIN | ✅ PASSED |
| 9 | TestTrainingPlans::test_remove_student | ADMIN | ✅ PASSED |
| 10 | TestTrainingPlans::test_plan_not_found | ADMIN | ✅ PASSED |
| 11 | TestTrainingPlans::test_add_trainer_to_plan | ADMIN | ✅ PASSED |
| 12 | TestTrainingPlans::test_list_plan_students | ADMIN | ✅ PASSED |
| 13 | TestTrainingPlans::test_assign_multiple | ADMIN | ✅ PASSED |
| 14 | TestTrainingPlans::test_list_trainers | ADMIN | ✅ PASSED |
| 15 | TestTrainingPlans::test_completion_status | ADMIN | ✅ PASSED |
| 16 | TestTrainingPlans::test_completion_status_student | STUDENT | ✅ PASSED |

### 3.10 Formando — Portal do Aluno (12 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestStudent::test_student_stats | STUDENT | ✅ PASSED |
| 2 | TestStudent::test_student_courses | STUDENT | ✅ PASSED |
| 3 | TestStudent::test_enroll_course | STUDENT | ✅ PASSED |
| 4 | TestStudent::test_enroll_duplicate | STUDENT | ✅ PASSED |
| 5 | TestStudent::test_get_enrolled_course | STUDENT | ✅ PASSED |
| 6 | TestStudent::test_student_certificates | STUDENT | ✅ PASSED |
| 7 | TestStudent::test_student_reports_overview | STUDENT | ✅ PASSED |
| 8 | TestStudent::test_student_reports_courses | STUDENT | ✅ PASSED |
| 9 | TestStudent::test_student_reports_lessons | STUDENT | ✅ PASSED |
| 10 | TestStudent::test_student_reports_achievements | STUDENT | ✅ PASSED |
| 11 | TestStudent::test_student_reports_dashboard | NONE | ✅ PASSED |
| 12 | TestStudent::test_student_reports_dashboard_endpoint | STUDENT | ✅ PASSED |
| 13 | TestStudent::test_student_stats_trainer_allowed | TRAINER | ✅ PASSED |

### 3.11 Desafios (28 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestChallenges::test_create_challenge | TRAINER | ✅ PASSED |
| 2 | TestChallenges::test_create_challenge_student_forbidden | STUDENT | ✅ PASSED |
| 3 | TestChallenges::test_list_course_challenges | TRAINER | ✅ PASSED |
| 4 | TestChallenges::test_get_challenge | TRAINER | ✅ PASSED |
| 5 | TestChallenges::test_update_challenge | TRAINER | ✅ PASSED |
| 6 | TestChallenges::test_release_challenge | TRAINER | ✅ PASSED |
| 7 | TestChallenges::test_release_for_student | TRAINER | ✅ PASSED |
| 8 | TestChallenges::test_is_released | TRAINER | ✅ PASSED |
| 9 | TestChallenges::test_eligible_students | TRAINER | ✅ PASSED |
| 10 | TestChallenges::test_student_released_challenges | STUDENT | ✅ PASSED |
| 11 | TestChallenges::test_submit_summary | TRAINER | ✅ PASSED |
| 12 | TestChallenges::test_list_challenge_submissions | TRAINER | ✅ PASSED |
| 13 | TestChallenges::test_get_submission_detail | TRAINER | ✅ PASSED |
| 14 | TestChallenges::test_pending_review_list | TRAINER | ✅ PASSED |
| 15 | TestChallenges::test_student_my_submissions | STUDENT | ✅ PASSED |
| 16 | TestChallenges::test_can_start_challenge | TRAINER | ✅ PASSED |
| 17 | TestChallenges::test_finalize_summary_submission | TRAINER | ✅ PASSED |
| 18 | TestChallenges::test_create_complete_challenge | TRAINER | ✅ PASSED |
| 19 | TestChallenges::test_release_complete_challenge | TRAINER | ✅ PASSED |
| 20 | TestChallenges::test_release_complete_for_student | TRAINER | ✅ PASSED |
| 21 | TestChallenges::test_start_challenge_complete_self | STUDENT | ✅ PASSED |
| 22 | TestChallenges::test_start_operation | STUDENT | ✅ PASSED |
| 23 | TestChallenges::test_finish_operation | STUDENT | ✅ PASSED |
| 24 | TestChallenges::test_list_submission_operations | STUDENT | ✅ PASSED |
| 25 | TestChallenges::test_submit_for_review | STUDENT | ✅ PASSED |
| 26 | TestChallenges::test_manual_finalize | TRAINER | ✅ PASSED |
| 27 | TestChallenges::test_start_challenge_complete_by_trainer | TRAINER | ✅ PASSED |

### 3.12 Lições (10 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestLessons::test_release_lesson | TRAINER | ✅ PASSED |
| 2 | TestLessons::test_start_lesson | TRAINER | ✅ PASSED |
| 3 | TestLessons::test_lesson_progress | STUDENT | ✅ PASSED |
| 4 | TestLessons::test_pause_lesson | TRAINER | ✅ PASSED |
| 5 | TestLessons::test_resume_lesson | TRAINER | ✅ PASSED |
| 6 | TestLessons::test_timer_state | TRAINER | ✅ PASSED |
| 7 | TestLessons::test_finish_lesson | TRAINER | ✅ PASSED |
| 8 | TestLessons::test_approve_lesson | TRAINER | ✅ PASSED |
| 9 | TestLessons::test_lesson_detail | TRAINER | ✅ PASSED |
| 10 | TestLessons::test_my_lessons_student | STUDENT | ✅ PASSED |
| 11 | TestLessons::test_confirm_lesson | STUDENT | ✅ PASSED |

### 3.13 Finalização (6 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestFinalization::test_course_status | TRAINER | ✅ PASSED |
| 2 | TestFinalization::test_plan_status | TRAINER | ✅ PASSED |
| 3 | TestFinalization::test_calculate_plan_status | TRAINER | ✅ PASSED |
| 4 | TestFinalization::test_finalize_course | TRAINER | ✅ PASSED |
| 5 | TestFinalization::test_finalize_plan | TRAINER | ✅ PASSED |
| 6 | TestFinalization::test_finalize_training_plan | ADMIN | ✅ PASSED |

### 3.14 Tutoria — Categorias (5 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaCategories::test_create_category | ADMIN | ✅ PASSED |
| 2 | TestTutoriaCategories::test_list_categories | ADMIN | ✅ PASSED |
| 3 | TestTutoriaCategories::test_update_category | ADMIN | ✅ PASSED |
| 4 | TestTutoriaCategories::test_create_category_student_forbidden | STUDENT | ✅ PASSED |
| 5 | TestTutoriaCategories::test_delete_category | ADMIN | ✅ PASSED |

### 3.15 Tutoria — Erros (9 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaErrors::test_create_error_admin | ADMIN | ✅ PASSED |
| 2 | TestTutoriaErrors::test_create_error_student_self | STUDENT | ✅ PASSED |
| 3 | TestTutoriaErrors::test_create_error_student_assign_other_forbidden | STUDENT | ✅ PASSED |
| 4 | TestTutoriaErrors::test_create_error_manager_assign | MANAGER | ✅ PASSED |
| 5 | TestTutoriaErrors::test_list_errors | ADMIN | ✅ PASSED |
| 6 | TestTutoriaErrors::test_get_error | ADMIN | ✅ PASSED |
| 7 | TestTutoriaErrors::test_update_error_admin | ADMIN | ✅ PASSED |
| 8 | TestTutoriaErrors::test_update_error_student_forbidden | STUDENT | ✅ PASSED |
| 9 | TestTutoriaErrors::test_list_products | ADMIN | ✅ PASSED |
| 10 | TestTutoriaErrors::test_list_error_plans | ADMIN | ✅ PASSED |

### 3.16 Tutoria — Análise (7 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaAnalysis::test_analysis_student_forbidden | STUDENT | ✅ PASSED |
| 2 | TestTutoriaAnalysis::test_save_analysis_manager | MANAGER | ✅ PASSED |
| 3 | TestTutoriaAnalysis::test_submit_analysis | MANAGER | ✅ PASSED |
| 4 | TestTutoriaAnalysis::test_return_analysis | TUTOR | ✅ PASSED |
| 5 | TestTutoriaAnalysis::test_approve_chief | ADMIN | ✅ PASSED |
| 6 | TestTutoriaAnalysis::test_approve_plans_tutor | TUTOR | ✅ PASSED |
| 7 | TestTutoriaAnalysis::test_confirm_solution | MANAGER | ✅ PASSED |
| 8 | TestTutoriaAnalysis::test_resolve_tutor | TUTOR | ✅ PASSED |

### 3.17 Tutoria — Planos de Ação (12 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaPlans::test_create_plan | ADMIN, TUTOR | ✅ PASSED |
| 2 | TestTutoriaPlans::test_list_plans | ADMIN | ✅ PASSED |
| 3 | TestTutoriaPlans::test_get_plan | ADMIN | ✅ PASSED |
| 4 | TestTutoriaPlans::test_update_plan | TUTOR | ✅ PASSED |
| 5 | TestTutoriaPlans::test_submit_plan | ADMIN | ✅ PASSED |
| 6 | TestTutoriaPlans::test_create_plan_student_forbidden | STUDENT, ADMIN | ✅ PASSED |
| 7 | TestTutoriaPlans::test_my_plans | ADMIN | ✅ PASSED |
| 8 | TestTutoriaPlans::test_approve_plan | ADMIN | ✅ PASSED |
| 9 | TestTutoriaPlans::test_return_plan | TUTOR | ✅ PASSED |
| 10 | TestTutoriaPlans::test_validate_plan | TUTOR | ✅ PASSED |
| 11 | TestTutoriaPlans::test_start_plan | ADMIN | ✅ PASSED |
| 12 | TestTutoriaPlans::test_complete_plan | ADMIN | ✅ PASSED |

### 3.18 Tutoria — Itens de Plano (5 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaItems::test_create_item | ADMIN | ✅ PASSED |
| 2 | TestTutoriaItems::test_list_plan_items | ADMIN | ✅ PASSED |
| 3 | TestTutoriaItems::test_update_item | ADMIN | ✅ PASSED |
| 4 | TestTutoriaItems::test_return_item | TUTOR | ✅ PASSED |
| 5 | TestTutoriaItems::test_complete_item | ADMIN | ✅ PASSED |

### 3.19 Tutoria — Fichas de Aprendizagem (6 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaSheets::test_create_sheet | TUTOR | ✅ PASSED |
| 2 | TestTutoriaSheets::test_list_sheets | TUTOR | ✅ PASSED |
| 3 | TestTutoriaSheets::test_my_sheets | STUDENT | ✅ PASSED |
| 4 | TestTutoriaSheets::test_submit_sheet | STUDENT | ✅ PASSED |
| 5 | TestTutoriaSheets::test_review_sheet | ADMIN | ✅ PASSED |
| 6 | TestTutoriaSheets::test_list_sheets_student_forbidden | STUDENT | ✅ PASSED |

### 3.20 Tutoria — Dashboard & Notificações (6 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaDashboard::test_dashboard_admin | ADMIN | ✅ PASSED |
| 2 | TestTutoriaDashboard::test_dashboard_unauthenticated | NONE | ✅ PASSED |
| 3 | TestTutoriaNotifications::test_list_notifications | ADMIN | ✅ PASSED |
| 4 | TestTutoriaNotifications::test_mark_notification_read | ADMIN | ✅ PASSED |
| 5 | TestTutoriaNotifications::test_mark_all_read | ADMIN | ✅ PASSED |
| 6 | TestTutoriaNotifications::test_notifications_unauthenticated | NONE | ✅ PASSED |

### 3.21 Tutoria — Comentários (4 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaComments::test_add_comment | ADMIN | ✅ PASSED |
| 2 | TestTutoriaComments::test_list_comments | ADMIN | ✅ PASSED |
| 3 | TestTutoriaComments::test_add_plan_comment | ADMIN | ✅ PASSED |
| 4 | TestTutoriaComments::test_list_plan_comments | ADMIN | ✅ PASSED |

### 3.22 Tutoria — Utilitários & Cancelamento (8 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTutoriaUtility::test_list_students | ADMIN | ✅ PASSED |
| 2 | TestTutoriaUtility::test_list_team | ADMIN | ✅ PASSED |
| 3 | TestTutoriaUtility::test_students_student_forbidden | STUDENT | ✅ PASSED |
| 4 | TestTutoriaCancelDeactivateVerify::test_cancel_error | ADMIN, MANAGER | ✅ PASSED |
| 5 | TestTutoriaCancelDeactivateVerify::test_cancel_student_forbidden | ADMIN, STUDENT | ✅ PASSED |
| 6 | TestTutoriaCancelDeactivateVerify::test_deactivate_admin | ADMIN | ✅ PASSED |
| 7 | TestTutoriaCancelDeactivateVerify::test_deactivate_manager_forbidden | MANAGER | ✅ PASSED |
| 8 | TestTutoriaCancelDeactivateVerify::test_verify_wrong_status | ADMIN | ✅ PASSED |

### 3.23 Erros Internos (18 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestInternalErrorsLookups::test_impacts | ADMIN | ✅ PASSED |
| 2 | TestInternalErrorsLookups::test_categories | ADMIN | ✅ PASSED |
| 3 | TestInternalErrorsLookups::test_error_types | ADMIN | ✅ PASSED |
| 4 | TestInternalErrorsLookups::test_departments | ADMIN | ✅ PASSED |
| 5 | TestInternalErrorsLookups::test_activities | ADMIN | ✅ PASSED |
| 6 | TestInternalErrorsLookups::test_banks | ADMIN | ✅ PASSED |
| 7 | TestInternalErrorsSensos::test_create_senso_tutor | TUTOR | ✅ PASSED |
| 8 | TestInternalErrorsSensos::test_create_senso_student_forbidden | STUDENT | ✅ PASSED |
| 9 | TestInternalErrorsSensos::test_list_sensos | ADMIN | ✅ PASSED |
| 10 | TestInternalErrorsSensos::test_update_senso | TUTOR | ✅ PASSED |
| 11 | TestInternalErrorsSensos::test_delete_senso | ADMIN | ✅ PASSED |
| 12 | TestInternalErrorsErrors::test_create_error_liberador | LIBERADOR | ✅ PASSED |
| 13 | TestInternalErrorsErrors::test_create_error_student_forbidden | STUDENT | ✅ PASSED |
| 14 | TestInternalErrorsErrors::test_list_errors | ADMIN | ✅ PASSED |
| 15 | TestInternalErrorsErrors::test_get_error | ADMIN | ✅ PASSED |
| 16 | TestInternalErrorsErrors::test_update_error_tutor | TUTOR | ✅ PASSED |
| 17 | TestInternalErrorsErrors::test_create_action_plan | TUTOR | ✅ PASSED |
| 18 | TestInternalErrorsErrors::test_create_learning_sheet | TUTOR | ✅ PASSED |
| 19 | TestInternalErrorsErrors::test_add_action_item | TUTOR | ✅ PASSED |
| 20 | TestInternalErrorsErrors::test_update_action_item | TUTOR | ✅ PASSED |
| 21 | TestInternalErrorsErrors::test_my_learning_sheets | STUDENT | ✅ PASSED |
| 22 | TestInternalErrorsErrors::test_mark_learning_sheet_read | STUDENT | ✅ PASSED |
| 23 | TestInternalErrorsErrors::test_internal_errors_dashboard | ADMIN | ✅ PASSED |

### 3.24 Equipas (15 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestTeams::test_create_team | ADMIN | ✅ PASSED |
| 2 | TestTeams::test_list_teams | ADMIN | ✅ PASSED |
| 3 | TestTeams::test_list_teams_manager | MANAGER | ✅ PASSED |
| 4 | TestTeams::test_list_teams_student_forbidden | STUDENT | ✅ PASSED |
| 5 | TestTeams::test_get_team | ADMIN | ✅ PASSED |
| 6 | TestTeams::test_update_team | ADMIN | ✅ PASSED |
| 7 | TestTeams::test_assign_member | ADMIN | ✅ PASSED |
| 8 | TestTeams::test_list_members | ADMIN | ✅ PASSED |
| 9 | TestTeams::test_add_service | ADMIN | ✅ PASSED |
| 10 | TestTeams::test_list_services | ADMIN | ✅ PASSED |
| 11 | TestTeams::test_remove_service | ADMIN | ✅ PASSED |
| 12 | TestTeams::test_remove_member | ADMIN | ✅ PASSED |
| 13 | TestTeams::test_unassigned_users | ADMIN | ✅ PASSED |
| 14 | TestTeams::test_create_team_student_forbidden | STUDENT | ✅ PASSED |
| 15 | TestTeams::test_delete_team | ADMIN | ✅ PASSED |

### 3.25 Chamados (10 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestChamados::test_create_chamado | STUDENT | ✅ PASSED |
| 2 | TestChamados::test_list_chamados | ADMIN | ✅ PASSED |
| 3 | TestChamados::test_get_chamado | ADMIN | ✅ PASSED |
| 4 | TestChamados::test_update_chamado_admin | ADMIN | ✅ PASSED |
| 5 | TestChamados::test_update_chamado_student_forbidden | STUDENT | ✅ PASSED |
| 6 | TestChamados::test_add_comment | STUDENT | ✅ PASSED |
| 7 | TestChamados::test_add_comment_admin | ADMIN | ✅ PASSED |
| 8 | TestChamados::test_list_with_filters | ADMIN | ✅ PASSED |
| 9 | TestChamados::test_delete_chamado | ADMIN | ✅ PASSED |
| 10 | TestChamados::test_chamado_unauthenticated | NONE | ✅ PASSED |

### 3.26 Chat (9 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestChat::test_send_message | STUDENT | ✅ PASSED |
| 2 | TestChat::test_send_message_help | STUDENT | ✅ PASSED |
| 3 | TestChat::test_send_message_es | STUDENT | ✅ PASSED |
| 4 | TestChat::test_chat_unauthenticated | NONE | ✅ PASSED |
| 5 | TestChat::test_create_faq | ADMIN | ✅ PASSED |
| 6 | TestChat::test_list_faqs | ADMIN | ✅ PASSED |
| 7 | TestChat::test_update_faq | ADMIN | ✅ PASSED |
| 8 | TestChat::test_delete_faq | ADMIN | ✅ PASSED |
| 9 | TestChat::test_create_faq_student_forbidden | STUDENT | ✅ PASSED |

### 3.27 Relatórios (10 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestRelatorios::test_overview_admin | ADMIN | ✅ PASSED |
| 2 | TestRelatorios::test_overview_student | STUDENT | ✅ PASSED |
| 3 | TestRelatorios::test_formacoes | ADMIN | ✅ PASSED |
| 4 | TestRelatorios::test_tutoria | ADMIN | ✅ PASSED |
| 5 | TestRelatorios::test_teams_admin | ADMIN | ✅ PASSED |
| 6 | TestRelatorios::test_teams_student_forbidden | STUDENT | ✅ PASSED |
| 7 | TestRelatorios::test_members_admin | ADMIN | ✅ PASSED |
| 8 | TestRelatorios::test_incidents_admin | ADMIN | ✅ PASSED |
| 9 | TestRelatorios::test_incidents_filters | ADMIN | ✅ PASSED |
| 10 | TestRelatorios::test_relatorios_unauthenticated | NONE | ✅ PASSED |

### 3.28 Avaliações — Ratings (9 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestRatings::test_submit_rating | STUDENT | ✅ PASSED |
| 2 | TestRatings::test_check_rating | STUDENT | ✅ PASSED |
| 3 | TestRatings::test_my_ratings | STUDENT | ✅ PASSED |
| 4 | TestRatings::test_admin_all_ratings | ADMIN | ✅ PASSED |
| 5 | TestRatings::test_admin_summary | ADMIN | ✅ PASSED |
| 6 | TestRatings::test_admin_dashboard | ADMIN | ✅ PASSED |
| 7 | TestRatings::test_check_specific_rating | STUDENT | ✅ PASSED |
| 8 | TestRatings::test_admin_item_ratings | ADMIN | ✅ PASSED |
| 9 | TestRatings::test_submit_rating_trainer_forbidden | TRAINER | ✅ PASSED |

### 3.29 Relatórios Avançados (7 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestAdvancedReports::test_dashboard_summary | ADMIN | ✅ PASSED |
| 2 | TestAdvancedReports::test_student_performance | ADMIN | ✅ PASSED |
| 3 | TestAdvancedReports::test_trainer_productivity | ADMIN | ✅ PASSED |
| 4 | TestAdvancedReports::test_course_analytics | ADMIN | ✅ PASSED |
| 5 | TestAdvancedReports::test_certification_trends | ADMIN | ✅ PASSED |
| 6 | TestAdvancedReports::test_mpu_analytics | ADMIN | ✅ PASSED |
| 7 | TestAdvancedReports::test_student_forbidden | STUDENT | ✅ PASSED |

### 3.30 Matriz de Conhecimento (3 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestKnowledgeMatrix::test_matrix_admin | ADMIN | ✅ PASSED |
| 2 | TestKnowledgeMatrix::test_matrix_manager | MANAGER | ✅ PASSED |
| 3 | TestKnowledgeMatrix::test_matrix_student_forbidden | STUDENT | ✅ PASSED |

### 3.31 Certificados (4 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestCertificates::test_list_certificates_admin | ADMIN | ✅ PASSED |
| 2 | TestCertificates::test_list_certificates_student | STUDENT | ✅ PASSED |
| 3 | TestCertificates::test_certificate_by_plan | ADMIN | ✅ PASSED |
| 4 | TestCertificates::test_certificate_not_found | ADMIN | ✅ PASSED |

### 3.32 Workflow Completo & Edge Cases (12 testes)

| # | Teste | Role | Status |
|---|---|---|---|
| 1 | TestFullWorkflow::test_chamado_lifecycle | STUDENT, ADMIN | ✅ PASSED |
| 2 | TestEdgeCases::test_error_not_found | ADMIN | ✅ PASSED |
| 3 | TestEdgeCases::test_plan_not_found | ADMIN | ✅ PASSED |
| 4 | TestEdgeCases::test_user_not_found | ADMIN | ✅ PASSED |
| 5 | TestEdgeCases::test_course_not_found | STUDENT | ✅ PASSED |
| 6 | TestEdgeCases::test_challenge_not_found | TRAINER | ✅ PASSED |
| 7 | TestEdgeCases::test_chamado_not_found | ADMIN | ✅ PASSED |
| 8 | TestEdgeCases::test_team_not_found | ADMIN | ✅ PASSED |
| 9 | TestEdgeCases::test_unauthenticated_endpoints | NONE | ✅ PASSED |
| 10 | TestEdgeCases::test_chamado_validation | STUDENT | ✅ PASSED |
| 11 | TestEdgeCases::test_empty_cancel_reason | ADMIN | ✅ PASSED |

---

## 4. Cobertura de Endpoints por Role

### ADMIN — Acesso Total
Endpoints testados: ~160+ rotas. Acesso completo a todos os módulos incluindo gestão de utilizadores, dados mestres, relatórios avançados, matriz de conhecimento, e operações de administração.

### MANAGER — Gestão de Equipa
Endpoints testados: Listagem de utilizadores, impactos, equipas, tutoria (criar erros, análise, confirmar solução).

### TRAINER — Formação
Endpoints testados: CRUD de cursos, lições, desafios, planos de formação, gestão de alunos, relatórios do formador, revisão de submissões.

### TUTOR — Tutoria
Endpoints testados: Retornar análise, aprovar planos, resolver erros, criar/atualizar censos, criar fichas de aprendizagem, planos de ação.

### STUDENT — Formando
Endpoints testados: Dashboard, cursos, inscrições, certificados, relatórios pessoais, submissões de desafios, fichas de aprendizagem, chamados, avaliações.

### LIBERADOR — Erros Internos
Endpoints testados: Criar erros internos.

### REFERENTE — Referência
Endpoints testados: Criado e verificado (perfil de acesso específico).

---

## 5. Testes de Controlo de Acesso (RBAC)

Os seguintes testes verificam que utilizadores **sem permissão** recebem respostas 403/401:

| Teste | Role Testado | Resultado Esperado |
|---|---|---|
| test_list_users_student_forbidden | STUDENT | 403 Forbidden |
| test_create_bank_student_forbidden | STUDENT | 403 Forbidden |
| test_create_product_student_forbidden | STUDENT | 403 Forbidden |
| test_create_impact_student_forbidden | STUDENT | 403 Forbidden |
| test_student_forbidden (courses) | STUDENT | 403 Forbidden |
| test_reports_student_forbidden | STUDENT | 403 Forbidden |
| test_create_lesson_student_forbidden | STUDENT | 403 Forbidden |
| test_create_challenge_student_forbidden | STUDENT | 403 Forbidden |
| test_create_category_student_forbidden | STUDENT | 403 Forbidden |
| test_update_error_student_forbidden | STUDENT | 403 Forbidden |
| test_analysis_student_forbidden | STUDENT | 403 Forbidden |
| test_create_plan_student_forbidden | STUDENT | 403 Forbidden |
| test_list_sheets_student_forbidden | STUDENT | 403 Forbidden |
| test_students_student_forbidden | STUDENT | 403 Forbidden |
| test_cancel_student_forbidden | STUDENT | 403 Forbidden |
| test_create_senso_student_forbidden | STUDENT | 403 Forbidden |
| test_create_error_student_forbidden (internal) | STUDENT | 403 Forbidden |
| test_list_teams_student_forbidden | STUDENT | 403 Forbidden |
| test_update_chamado_student_forbidden | STUDENT | 403/ownership |
| test_create_faq_student_forbidden | STUDENT | 403 Forbidden |
| test_teams_student_forbidden (relatórios) | STUDENT | 403 Forbidden |
| test_submit_rating_trainer_forbidden | TRAINER | 403 Forbidden |
| test_student_forbidden (advanced reports) | STUDENT | 403 Forbidden |
| test_matrix_student_forbidden | STUDENT | 403 Forbidden |
| test_deactivate_manager_forbidden | MANAGER | 403 Forbidden |
| test_create_error_student_assign_other_forbidden | STUDENT | 403 Forbidden |

---

## 6. Ficheiro de Output Bruto

O output completo do pytest está disponível em: `docs/TEST_EVIDENCE_RAW.txt`

**Comando utilizado:**
```bash
cd backend
python -m pytest tests/test_all_portals.py -v --tb=short
```

**Resultado:**
```
=============== 341 passed, 1 skipped, 13828 warnings in 11.19s ===============
```

---

## 7. Como Reproduzir

```bash
# 1. Limpar base de dados (mantém admin)
cd backend
python scripts/clean_database.py

# 2. Executar todos os testes
python -m pytest tests/test_all_portals.py -v --tb=short

# 3. Executar testes de um módulo específico
python -m pytest tests/test_all_portals.py -v -k "TestChallenges"

# 4. Executar testes por role
python -m pytest tests/test_all_portals.py -v -k "student"
```
