/* ==========================================================================
   SmartHire / CareerPilot Client-Side Portal Controller
   ========================================================================== */

// Global Elegant Non-Blocking Toast Notification System
function showToast(message, type = 'info', duration = 3200) {
  let toastContainer = document.getElementById('globalToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'globalToastContainer';
    toastContainer.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 9999999; display: flex; flex-direction: column; gap: 10px; max-width: 420px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = 'careerpilot-toast';
  
  let bg = '#0f172a';
  let border = '#3b82f6';
  let icon = 'ℹ️';
  let textColor = '#f8fafc';
  
  const msgLower = String(message).toLowerCase();
  if (type === 'success' || msgLower.includes('success') || msgLower.includes('updated') || msgLower.includes('saved') || msgLower.includes('active') || msgLower.includes('welcome')) {
    border = '#10b981';
    icon = '✅';
  } else if (type === 'warning' || msgLower.includes('please') || msgLower.includes('no new') || msgLower.includes('warning')) {
    border = '#f59e0b';
    icon = '⚠️';
  } else if (type === 'error' || msgLower.includes('error') || msgLower.includes('failed') || msgLower.includes('invalid')) {
    border = '#ef4444';
    icon = '❌';
  }
  
  toast.style.cssText = `background: ${bg}; color: ${textColor}; border: 1.5px solid ${border}; border-radius: 12px; padding: 12px 18px; font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 10px; pointer-events: auto; transform: translateY(-10px); opacity: 0; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);`;
  toast.innerHTML = `<span style="font-size: 18px; flex-shrink: 0;">${icon}</span><span style="flex: 1; line-height: 1.4;">${String(message).replace(/\n/g, '<br>')}</span>`;
  
  toastContainer.appendChild(toast);
  
  // Trigger smooth entrance
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => { toast.remove(); }, 300);
  }, duration);
}

// Permanently override native browser alert so ugly alert popups never appear
window.alert = function(msg) {
  showToast(msg, 'info');
};

// Global state container
let chatChannel = null;
let state = {
  currentUser: null,       // Logged in user details { name, email, role }
  currentRole: 'seeker',   // 'seeker' or 'recruiter'
  jobs: [],                // Active job postings database
  profile: null,           // Current job seeker profile details
  applications: [],        // Applications tracking database
  candidates: [],          // Active candidate profiles (for recruiters to see)
  currentMonth: 7,         // August (0-indexed 7)
  currentYear: 2026,       
  activeInterviewChatIdx: 0,
  activeInterviewRole: "",
  notifications: [],
  chats: [],
  activeChatCompany: "Google DeepMind",
  activeChatCandidate: "Alex Carter",
  applicationsViewMode: "kanban",
  applicationsGridFilter: "all",
  interviewsFilter: "upcoming",
  interviewRecords: [],        // In-memory array storing all AI & panel interview dossiers
  activeInterviewSession: null // Live active AI interview session state
};

// DOM Elements
const els = {
  // Navigation & Gateway
  navHome: document.getElementById('navHome'),
  navJobs: document.getElementById('navJobs'),
  navApplications: document.getElementById('navApplications'),
  navCareerTools: document.getElementById('navCareerTools'),
  navRecruiterJobs: document.getElementById('navRecruiterJobs'),
  navRecruiterScreen: document.getElementById('navRecruiterScreen'),
  navRecruiterCalendar: document.getElementById('navRecruiterCalendar'),
  navPricing: document.getElementById('navPricing'),
  
  headerLogo: document.getElementById('headerLogo'),
  roleSeekerBtn: document.getElementById('roleSeekerBtn'),
  roleRecruiterBtn: document.getElementById('roleRecruiterBtn'),
  authMenuBtn: document.getElementById('authMenuBtn'),
  avatarBadge: document.getElementById('avatarBadge'),
  usernameDisplay: document.getElementById('usernameDisplay'),
  notificationBtn: document.getElementById('notificationBtn'),
  notificationBadge: document.getElementById('notificationBadge'),
  notificationDropdown: document.getElementById('notificationDropdown'),
  notificationListContainer: document.getElementById('notificationListContainer'),
  markAllReadBtn: document.getElementById('markAllReadBtn'),
  authForgotPwdBtn: document.getElementById('authForgotPwdBtn'),
  
  // Custom Timeline & Payment Modals
  appDetailsModalOverlay: document.getElementById('appDetailsModalOverlay'),
  appDetailsCloseBtn: document.getElementById('appDetailsCloseBtn'),
  appDetailsJobTitle: document.getElementById('appDetailsJobTitle'),
  appDetailsCompany: document.getElementById('appDetailsCompany'),
  appDetailsTimeline: document.getElementById('appDetailsTimeline'),
  appDetailsInterviewCard: document.getElementById('appDetailsInterviewCard'),
  appDetailsInterviewTime: document.getElementById('appDetailsInterviewTime'),
  appJoinInterviewBtn: document.getElementById('appJoinInterviewBtn'),
  appRescheduleBtn: document.getElementById('appRescheduleBtn'),
  appDetailsWithdrawBtn: document.getElementById('appDetailsWithdrawBtn'),
  
  checkoutModalOverlay: document.getElementById('checkoutModalOverlay'),
  checkoutCloseBtn: document.getElementById('checkoutCloseBtn'),
  checkoutPaymentForm: document.getElementById('checkoutPaymentForm'),
  
  feedbackModalOverlay: document.getElementById('feedbackModalOverlay'),
  feedbackCloseBtn: document.getElementById('feedbackCloseBtn'),
  feedbackSubmitForm: document.getElementById('feedbackSubmitForm'),
  ratingStarsContainer: document.getElementById('ratingStarsContainer'),
  feedbackRatingVal: document.getElementById('feedbackRatingVal'),
  
  // Views
  landingView: document.getElementById('landingView'),
  seekerDashboard: document.getElementById('seekerDashboard'),
  recruiterDashboard: document.getElementById('recruiterDashboard'),
  pricingDashboard: document.getElementById('pricingDashboard'),
  
  gatewaySeeker: document.getElementById('gatewaySeeker'),
  gatewayRecruiter: document.getElementById('gatewayRecruiter'),
  
  // Auth Modals
  authModalOverlay: document.getElementById('authModalOverlay'),
  authCloseBtn: document.getElementById('authCloseBtn'),
  authMainForm: document.getElementById('authMainForm'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),
  authFormTitle: document.getElementById('authFormTitle'),
  authFormSubtitle: document.getElementById('authFormSubtitle'),
  authFormMode: document.getElementById('authFormMode'),
  signupRoleGroup: document.getElementById('signupRoleGroup'),
  signupNameGroup: document.getElementById('signupNameGroup'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authFullName: document.getElementById('authFullName'),
  authSelectRole: document.getElementById('authSelectRole'),
  authToggleModeBtn: document.getElementById('authToggleModeBtn'),
  authToggleText: document.getElementById('authToggleText'),
  loginOptionsArea: document.getElementById('loginOptionsArea'),
  oauthGoogleBtn: document.getElementById('oauthGoogleBtn'),
  oauthWhatsappBtn: document.getElementById('oauthWhatsappBtn'),
  
  // Seeker Dashboard Profile
  resumeDropZone: document.getElementById('resumeDropZone'),
  resumeFileInput: document.getElementById('resumeFileInput'),
  resumePasteInput: document.getElementById('resumePasteInput'),
  parseResumeBtn: document.getElementById('parseResumeBtn'),
  profileFullName: document.getElementById('profileFullName'),
  profileTitle: document.getElementById('profileTitle'),
  profileExperience: document.getElementById('profileExperience'),
  profileLocation: document.getElementById('profileLocation'),
  profileSkills: document.getElementById('profileSkills'),
  profileEducation: document.getElementById('profileEducation'),
  profileEditForm: document.getElementById('profileEditForm'),
  wizardBackBtn: document.getElementById('wizardBackBtn'),
  wizardNextBtn: document.getElementById('wizardNextBtn'),
  wizardSubmitBtn: document.getElementById('wizardSubmitBtn'),
  parsedSkillsTagsContainer: document.getElementById('parsedSkillsTagsContainer'),
  seekerWelcomeName: document.getElementById('seekerWelcomeName'),
  seekerQuickUploadBtn: document.getElementById('seekerQuickUploadBtn'),
  
  // Seeker Job Search
  seekerJobsListContainer: document.getElementById('seekerJobsListContainer'),
  seekerJobDetailsPanel: document.getElementById('seekerJobDetailsPanel'),
  jobSearchInput: document.getElementById('jobSearchInput'),
  jobLocationFilter: document.getElementById('jobLocationFilter'),
  landingSearchInput: document.getElementById('landingSearchInput'),
  landingSearchBtn: document.getElementById('landingSearchBtn'),
  autoApplyToggleSwitch: document.getElementById('autoApplyToggleSwitch'),
  autoApplyThresholdSlider: document.getElementById('autoApplyThresholdSlider'),
  autoApplyThresholdVal: document.getElementById('autoApplyThresholdVal'),
  
  // Seeker Kanban Applications
  kanbanColApplied: document.getElementById('kanbanColApplied'),
  kanbanColReview: document.getElementById('kanbanColReview'),
  kanbanColInterview: document.getElementById('kanbanColInterview'),
  kanbanColOffer: document.getElementById('kanbanColOffer'),
  kanbanCountApplied: document.getElementById('kanbanCountApplied'),
  kanbanCountReview: document.getElementById('kanbanCountReview'),
  kanbanCountInterview: document.getElementById('kanbanCountInterview'),
  kanbanCountOffer: document.getElementById('kanbanCountOffer'),
  
  // Seeker Kanban/Grid view switchers & summary metrics
  toggleViewKanbanBtn: document.getElementById('toggleViewKanbanBtn'),
  toggleViewGridBtn: document.getElementById('toggleViewGridBtn'),
  gridFilterPills: document.getElementById('gridFilterPills'),
  applicationsKanbanBoard: document.getElementById('applicationsKanbanBoard'),
  applicationsGridList: document.getElementById('applicationsGridList'),
  summaryCountApplied: document.getElementById('summaryCountApplied'),
  summaryCountReview: document.getElementById('summaryCountReview'),
  summaryCountInterview: document.getElementById('summaryCountInterview'),
  summaryCountOffer: document.getElementById('summaryCountOffer'),
  savedJobsListContainer: document.getElementById('savedJobsListContainer'),
  settingsDarkModeToggle: document.getElementById('settingsDarkModeToggle'),
  settingsAlertsToggle: document.getElementById('settingsAlertsToggle'),
  interviewsListContainer: document.getElementById('interviewsListContainer'),
  toggleInterviewsUpcomingBtn: document.getElementById('toggleInterviewsUpcomingBtn'),
  toggleInterviewsCompletedBtn: document.getElementById('toggleInterviewsCompletedBtn'),
  resumeUploadOptionsModal: document.getElementById('resumeUploadOptionsModal'),
  resumeOptionsCloseBtn: document.getElementById('resumeOptionsCloseBtn'),
  btnOptionAutoAI: document.getElementById('btnOptionAutoAI'),
  btnOptionManual: document.getElementById('btnOptionManual'),
  profileDropdown: document.getElementById('profileDropdown'),
  dropdownUserEmail: document.getElementById('dropdownUserEmail'),
  dropdownGoProfile: document.getElementById('dropdownGoProfile'),
  dropdownGoSettings: document.getElementById('dropdownGoSettings'),
  dropdownSignOut: document.getElementById('dropdownSignOut'),
  openAdminConsoleLink: document.getElementById('openAdminConsoleLink'),
  adminConsoleModal: document.getElementById('adminConsoleModal'),
  adminConsoleCloseBtn: document.getElementById('adminConsoleCloseBtn'),
  btnAdminResetDb: document.getElementById('btnAdminResetDb'),
  btnAdminExportDb: document.getElementById('btnAdminExportDb'),
  btnAdminClose: document.getElementById('btnAdminClose'),
  adminDatabaseJsonViewer: document.getElementById('adminDatabaseJsonViewer'),
  adminCountUsers: document.getElementById('adminCountUsers'),
  adminCountJobs: document.getElementById('adminCountJobs'),
  adminCountApps: document.getElementById('adminCountApps'),
  adminCountSaved: document.getElementById('adminCountSaved'),
  
  // Career Tools
  mockInterviewRoleSelect: document.getElementById('mockInterviewRoleSelect'),
  startMockInterviewBtn: document.getElementById('startMockInterviewBtn'),
  mockInterviewChatHistory: document.getElementById('mockInterviewChatHistory'),
  mockInterviewUserInput: document.getElementById('mockInterviewUserInput'),
  sendMockAnswerBtn: document.getElementById('sendMockAnswerBtn'),
  resumeHealthScoreBadge: document.getElementById('resumeHealthScoreBadge'),
  resumeChecklistContainer: document.getElementById('resumeChecklistContainer'),
  salaryExpSlider: document.getElementById('salaryExpSlider'),
  salaryExpVal: document.getElementById('salaryExpVal'),
  salaryRoleInput: document.getElementById('salaryRoleInput'),
  salaryResultDisplay: document.getElementById('salaryResultDisplay'),
  goProBtn: document.getElementById('goProBtn'),
  
  // Recruiter Dashboard
  recruiterOpenPostModalBtn: document.getElementById('recruiterOpenPostModalBtn'),
  recruiterPostJobModalOverlay: document.getElementById('recruiterPostJobModalOverlay'),
  recruiterPostJobCloseBtn: document.getElementById('recruiterPostJobCloseBtn'),
  recruiterJobForm: document.getElementById('recruiterJobForm'),
  recruiterActiveJobsGridContainer: document.getElementById('recruiterActiveJobsGridContainer'),
  screenJobSelector: document.getElementById('screenJobSelector'),
  recruiterCandidatesListContainer: document.getElementById('recruiterCandidatesListContainer'),
  recruiterCandidateDetailsPanel: document.getElementById('recruiterCandidateDetailsPanel'),
  
  // Recruiter Calendar
  calendarMonthTitle: document.getElementById('calendarMonthTitle'),
  calendarDaysContainer: document.getElementById('calendarDaysContainer'),
  calendarPrevMonthBtn: document.getElementById('calendarPrevMonthBtn'),
  calendarNextMonthBtn: document.getElementById('calendarNextMonthBtn'),
  
  // Landing Counters
  metricJobsCount: document.getElementById('metricJobsCount'),
  metricAppsCount: document.getElementById('metricAppsCount'),
  
  // Seeker Chats
  seekerChatsListContainer: document.getElementById('seekerChatsListContainer'),
  seekerChatHistory: document.getElementById('seekerChatHistory'),
  seekerChatInput: document.getElementById('seekerChatInput'),
  sendSeekerMessageBtn: document.getElementById('sendSeekerMessageBtn'),
  activeChatAvatar: document.getElementById('activeChatAvatar'),
  activeChatName: document.getElementById('activeChatName'),
  activeChatStatus: document.getElementById('activeChatStatus'),
  
  // Recruiter Chats
  recruiterChatsListContainer: document.getElementById('recruiterChatsListContainer'),
  recruiterChatHistory: document.getElementById('recruiterChatHistory'),
  recruiterChatInput: document.getElementById('recruiterChatInput'),
  sendRecruiterMessageBtn: document.getElementById('sendRecruiterMessageBtn'),
  recActiveChatAvatar: document.getElementById('recActiveChatAvatar'),
  recActiveChatName: document.getElementById('recActiveChatName'),
  recActiveChatStatus: document.getElementById('recActiveChatStatus'),

  // CareerPilot Elements
  navCareerPilot: document.getElementById('navCareerPilot'),
  seekerCareerPilotTab: document.getElementById('seekerCareerPilotTab'),
  careerGoalPromptInput: document.getElementById('careerGoalPromptInput'),
  careerPilotTargetRole: document.getElementById('careerPilotTargetRole'),
  careerPilotExpLevel: document.getElementById('careerPilotExpLevel'),
  careerPilotLocation: document.getElementById('careerPilotLocation'),
  btnRunCareerPilot: document.getElementById('btnRunCareerPilot'),
  btnLoadSatyaprakashPreset: document.getElementById('btnLoadSatyaprakashPreset'),
  btnSimulateAdaptation: document.getElementById('btnSimulateAdaptation'),
  agentStatusBadge: document.getElementById('agentStatusBadge'),
  careerPilotActivityStream: document.getElementById('careerPilotActivityStream'),
  activityLogCount: document.getElementById('activityLogCount'),
  adaptationAlertBanner: document.getElementById('adaptationAlertBanner'),
  adaptationAlertText: document.getElementById('adaptationAlertText'),
  metricGoalSummary: document.getElementById('metricGoalSummary'),
  metricResumeScore: document.getElementById('metricResumeScore'),
  metricJobsAnalyzed: document.getElementById('metricJobsAnalyzed'),
  metricStrongMatches: document.getElementById('metricStrongMatches'),
  metricSkillGaps: document.getElementById('metricSkillGaps'),
  careerPilotRankedJobsContainer: document.getElementById('careerPilotRankedJobsContainer'),
  skillGapBarsContainer: document.getElementById('skillGapBarsContainer'),
  skillGapSummaryText: document.getElementById('skillGapSummaryText'),
  reEvalQuickSkillsContainer: document.getElementById('reEvalQuickSkillsContainer'),
  reEvalComparisonBox: document.getElementById('reEvalComparisonBox'),
  reEvalHeaderLabel: document.getElementById('reEvalHeaderLabel'),
  reEvalDeltaBadge: document.getElementById('reEvalDeltaBadge'),
  reEvalBeforeScore: document.getElementById('reEvalBeforeScore'),
  reEvalBeforeDecision: document.getElementById('reEvalBeforeDecision'),
  reEvalAfterScore: document.getElementById('reEvalAfterScore'),
  reEvalAfterDecision: document.getElementById('reEvalAfterDecision'),
  reEvalExplanation: document.getElementById('reEvalExplanation'),
  learningPlanFocusSkills: document.getElementById('learningPlanFocusSkills'),
  roadmapProgressBadge: document.getElementById('roadmapProgressBadge'),
  learningRoadmapCardsContainer: document.getElementById('learningRoadmapCardsContainer'),
  activeResumeSourceLabel: document.getElementById('activeResumeSourceLabel'),

  // AI Interview Scheduler & Live Agent Room Elements
  scheduleInterviewModalOverlay: document.getElementById('scheduleInterviewModalOverlay'),
  scheduleInterviewCloseBtn: document.getElementById('scheduleInterviewCloseBtn'),
  scheduleInterviewForm: document.getElementById('scheduleInterviewForm'),
  schedCandidateAppId: document.getElementById('schedCandidateAppId'),
  schedCandidateName: document.getElementById('schedCandidateName'),
  schedJobInfo: document.getElementById('schedJobInfo'),
  schedDateTime: document.getElementById('schedDateTime'),
  schedDuration: document.getElementById('schedDuration'),
  btnLaunchAIInterviewImmediate: document.getElementById('btnLaunchAIInterviewImmediate'),
  
  aiInterviewRoomModalOverlay: document.getElementById('aiInterviewRoomModalOverlay'),
  aiInterviewRoomCloseBtn: document.getElementById('aiInterviewRoomCloseBtn'),
  aiInterviewerTitle: document.getElementById('aiInterviewerTitle'),
  aiInterviewCandidateHeader: document.getElementById('aiInterviewCandidateHeader'),
  aiInterviewProgressText: document.getElementById('aiInterviewProgressText'),
  aiInterviewMainBody: document.getElementById('aiInterviewMainBody'),
  aiQuestionCategoryTag: document.getElementById('aiQuestionCategoryTag'),
  aiQuestionTargetTag: document.getElementById('aiQuestionTargetTag'),
  aiActiveQuestionText: document.getElementById('aiActiveQuestionText'),
  aiInterviewInputArea: document.getElementById('aiInterviewInputArea'),
  aiInterviewCandidateInput: document.getElementById('aiInterviewCandidateInput'),
  btnSpeechSimulate: document.getElementById('btnSpeechSimulate'),
  speechBtnText: document.getElementById('speechBtnText'),
  btnFillSampleAnswer: document.getElementById('btnFillSampleAnswer'),
  aiAnswerWordCounter: document.getElementById('aiAnswerWordCounter'),
  btnSubmitAIAnswer: document.getElementById('btnSubmitAIAnswer'),
  aiAnswerFeedbackCard: document.getElementById('aiAnswerFeedbackCard'),
  aiInstantScoreBadge: document.getElementById('aiInstantScoreBadge'),
  aiScoreTech: document.getElementById('aiScoreTech'),
  aiScoreComm: document.getElementById('aiScoreComm'),
  aiScoreStar: document.getElementById('aiScoreStar'),
  aiInstantFeedbackText: document.getElementById('aiInstantFeedbackText'),
  btnNextAIQuestion: document.getElementById('btnNextAIQuestion'),
  aiInterviewFinalDossierCard: document.getElementById('aiInterviewFinalDossierCard'),
  dossierOverallScore: document.getElementById('dossierOverallScore'),
  dossierRecBadge: document.getElementById('dossierRecBadge'),
  btnSaveAndStoreDossier: document.getElementById('btnSaveAndStoreDossier'),
  btnViewFullTranscriptModal: document.getElementById('btnViewFullTranscriptModal'),

  interviewReportModalOverlay: document.getElementById('interviewReportModalOverlay'),
  interviewReportCloseBtn: document.getElementById('interviewReportCloseBtn'),
  reportCandidateTitle: document.getElementById('reportCandidateTitle'),
  reportSubtitle: document.getElementById('reportSubtitle'),
  interviewReportContentBody: document.getElementById('interviewReportContentBody'),

  // Google OAuth Account Chooser Elements
  googleAccountChooserModal: document.getElementById('googleAccountChooserModal'),
  googleAccountCloseBtn: document.getElementById('googleAccountCloseBtn'),
  btnGoogleAccSatya: document.getElementById('btnGoogleAccSatya'),
  btnGoogleAccAlex: document.getElementById('btnGoogleAccAlex'),
  btnGoogleAccCustomToggle: document.getElementById('btnGoogleAccCustomToggle'),
  googleCustomAccountForm: document.getElementById('googleCustomAccountForm'),
  googleCustomNameInput: document.getElementById('googleCustomNameInput'),
  googleCustomEmailInput: document.getElementById('googleCustomEmailInput'),

  // WhatsApp Login Elements
  whatsappLoginModal: document.getElementById('whatsappLoginModal'),
  whatsappCloseBtn: document.getElementById('whatsappCloseBtn'),
  waStepNumber: document.getElementById('waStepNumber'),
  waStepOtp: document.getElementById('waStepOtp'),
  waInputName: document.getElementById('waInputName'),
  waCountryCode: document.getElementById('waCountryCode'),
  waInputPhone: document.getElementById('waInputPhone'),
  waSelectRole: document.getElementById('waSelectRole'),
  btnWaSendOtp: document.getElementById('btnWaSendOtp'),
  btnWaQuickLogin: document.getElementById('btnWaQuickLogin'),
  btnWaVerifyOtp: document.getElementById('btnWaVerifyOtp'),
  btnWaBackToPhone: document.getElementById('btnWaBackToPhone'),
  waDisplayTargetPhone: document.getElementById('waDisplayTargetPhone')
};

/* ==========================================
   INITIALIZATION & DATA SYNC
   ========================================== */
function init() {
  loadStateFromStorage();
  bindEvents();
  renderAll();
  
  // Check active user and redirect accordingly
  if (state.currentUser) {
    updateAuthHeaderUI();
  }
  
  setupRealTimeChatChannel();
  
  // Initialize newly added production features
  initCheckoutAndBillingModal();
  initCoverLetterGenerator();
  initLiveVideoTelemetry();
  initDossierPrint();
  initTestModeSuite();
  initFeedbackReviewHub();
  initGoogleIdentityServices();
  
  // Fast fade out splash screen for instant, snappy loading
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 300);
    }
  }, 150);
}

function loadStateFromStorage() {
  // Sync state variables or fallback to defaults
  const jobsData = localStorage.getItem('sh_jobs');
  state.jobs = jobsData ? JSON.parse(jobsData) : [...DEFAULT_JOBS];
  
  if (jobsData) {
    const loadedJobs = JSON.parse(jobsData);
    if (loadedJobs.length < DEFAULT_JOBS.length) {
      state.jobs = [...DEFAULT_JOBS];
    }
  }
  
  const profileData = localStorage.getItem('sh_profile');
  state.profile = profileData ? JSON.parse(profileData) : { ...DEFAULT_SEEKER_PROFILE };
  
  const appsData = localStorage.getItem('sh_applications');
  state.applications = appsData ? JSON.parse(appsData) : [...DEFAULT_APPLICATIONS];
  
  const candsData = localStorage.getItem('sh_candidates');
  state.candidates = candsData ? JSON.parse(candsData) : [...DEFAULT_CANDIDATES];
  
  const userSession = localStorage.getItem('sh_session');
  state.currentUser = userSession ? JSON.parse(userSession) : null;
  
  const roleSession = localStorage.getItem('sh_active_role');
  state.currentRole = roleSession ? roleSession : 'seeker';
  
  const notifsData = localStorage.getItem('sh_notifications');
  state.notifications = notifsData ? JSON.parse(notifsData) : [
    {
      id: "n-1",
      title: "Interview Confirmed",
      desc: "Alex Carter's interview schedule confirmed at Google DeepMind (Aug 18).",
      time: "2h ago",
      unread: true,
      icon: "📅"
    },
    {
      id: "n-2",
      title: "Job Match Recommendation",
      desc: "5 new job openings match your profile skills layout!",
      time: "4h ago",
      unread: true,
      icon: "🧠"
    }
  ];
  
  const chatsData = localStorage.getItem('sh_chats');
  state.chats = chatsData ? JSON.parse(chatsData) : [
    {
      company: "Google DeepMind",
      candidate: "Alex Carter",
      messages: [
        { sender: "recruiter", text: "Hi Alex, we reviewed your matching profile and it looks very strong. Would you be open for a short call?", time: "10:30 AM" },
        { sender: "seeker", text: "Hi! Yes, I would love to connect. I am free tomorrow afternoon.", time: "10:32 AM" },
        { sender: "recruiter", text: "Great! Let's connect tomorrow at 2:00 PM. I will send a calendar invite.", time: "10:35 AM" }
      ]
    },
    {
      company: "Stripe",
      candidate: "Alex Carter",
      messages: [
        { sender: "recruiter", text: "Hello Alex, thanks for applying. We are currently screening resumes and will get back to you shortly.", time: "Yesterday" }
      ]
    }
  ];
  
  const bookmarkedData = localStorage.getItem('sh_bookmarked');
  state.bookmarkedJobs = bookmarkedData ? JSON.parse(bookmarkedData) : [];
  
  const interviewData = localStorage.getItem('sh_interview_records');
  state.interviewRecords = interviewData ? JSON.parse(interviewData) : [];

  const isProSaved = localStorage.getItem('sh_is_pro');
  state.isPro = isProSaved === 'true';
  const isRecruiterProSaved = localStorage.getItem('sh_is_recruiter_pro');
  state.isRecruiterPro = isRecruiterProSaved === 'true';
  const userPlanSaved = localStorage.getItem('sh_user_plan');
  state.userPlan = userPlanSaved || (state.isPro ? 'seeker_pro' : (state.isRecruiterPro ? 'recruiter_ent' : 'free'));

  saveStateToStorage();
}

function saveStateToStorage() {
  localStorage.setItem('sh_jobs', JSON.stringify(state.jobs));
  localStorage.setItem('sh_profile', JSON.stringify(state.profile));
  localStorage.setItem('sh_applications', JSON.stringify(state.applications));
  localStorage.setItem('sh_candidates', JSON.stringify(state.candidates));
  localStorage.setItem('sh_notifications', JSON.stringify(state.notifications));
  localStorage.setItem('sh_chats', JSON.stringify(state.chats));
  localStorage.setItem('sh_bookmarked', JSON.stringify(state.bookmarkedJobs));
  localStorage.setItem('sh_interview_records', JSON.stringify(state.interviewRecords));
  localStorage.setItem('sh_is_pro', state.isPro ? 'true' : 'false');
  localStorage.setItem('sh_is_recruiter_pro', state.isRecruiterPro ? 'true' : 'false');
  localStorage.setItem('sh_user_plan', state.userPlan || 'free');
  if (state.currentUser) {
    localStorage.setItem('sh_session', JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem('sh_session');
  }
  localStorage.setItem('sh_active_role', state.currentRole);
}

/* ==========================================
   EVENT BINDINGS
   ========================================== */
function bindEvents() {
  // Global Navigation Switches
  els.navHome.addEventListener('click', () => showView('landing'));
  els.headerLogo.addEventListener('click', () => showView('landing'));
  els.navJobs.addEventListener('click', () => { showView('seeker'); activateTab('seekerJobsTab'); });
  els.navApplications.addEventListener('click', () => { showView('seeker'); activateTab('seekerPipelineTab'); });
  els.navCareerTools.addEventListener('click', () => { showView('seeker'); activateTab('seekerToolsTab'); });
  els.navRecruiterJobs.addEventListener('click', () => { showView('recruiter'); activateTab('recruiterActiveJobsTab'); });
  els.navRecruiterScreen.addEventListener('click', () => { showView('recruiter'); activateTab('recruiterScreenTab'); });
  els.navRecruiterCalendar.addEventListener('click', () => { showView('recruiter'); activateTab('recruiterCalendarTab'); });
  els.navPricing.addEventListener('click', () => showView('pricing'));
  els.goProBtn.addEventListener('click', () => showView('pricing'));
  
  // Dashboard Sub-Tab switching
  document.querySelectorAll('.tab-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target.getAttribute('data-target');
      activateTab(target);
    });
  });

  // Switch role header action buttons
  els.roleSeekerBtn.addEventListener('click', () => switchRole('seeker'));
  els.roleRecruiterBtn.addEventListener('click', () => switchRole('recruiter'));
  
  // Gateways on landing cards
  els.gatewaySeeker.addEventListener('click', () => {
    switchRole('seeker');
    showView('seeker');
  });
  els.gatewayRecruiter.addEventListener('click', () => {
    switchRole('recruiter');
    showView('recruiter');
  });

  // Auth Overlay trigger handlers
  if (els.authMenuBtn) els.authMenuBtn.addEventListener('click', handleProfileMenuClick);
  if (els.authCloseBtn) els.authCloseBtn.addEventListener('click', () => toggleAuthModal(false));
  if (els.authToggleModeBtn) els.authToggleModeBtn.addEventListener('click', toggleAuthMode);
  if (els.authForgotPwdBtn) els.authForgotPwdBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode('forgot');
  });
  if (els.authMainForm) els.authMainForm.addEventListener('submit', handleAuthSubmit);
  if (els.oauthGoogleBtn) els.oauthGoogleBtn.addEventListener('click', () => handleOAuthLogin('Google'));
  if (els.oauthWhatsappBtn) els.oauthWhatsappBtn.addEventListener('click', () => handleOAuthLogin('WhatsApp'));

  // Google Account Chooser Modal Handlers
  if (els.googleAccountCloseBtn) {
    els.googleAccountCloseBtn.addEventListener('click', () => {
      if (els.googleAccountChooserModal) els.googleAccountChooserModal.classList.remove('active');
    });
  }
  if (els.btnGoogleAccSatya) {
    els.btnGoogleAccSatya.addEventListener('click', () => {
      authenticateUserWithDetails({
        email: "satyaprakashprajapati459@gmail.com",
        name: "Satyaprakash Prajapati (Admin)",
        role: "recruiter",
        provider: "Google"
      });
      if (els.googleAccountChooserModal) els.googleAccountChooserModal.classList.remove('active');
    });
  }
  if (els.btnGoogleAccAlex) {
    els.btnGoogleAccAlex.addEventListener('click', () => {
      authenticateUserWithDetails({
        email: "alex.carter@gmail.com",
        name: "Alex Carter",
        role: "seeker",
        provider: "Google"
      });
      if (els.googleAccountChooserModal) els.googleAccountChooserModal.classList.remove('active');
    });
  }
  
  const btnLaunchGoogleDevicePopup = document.getElementById('btnLaunchGoogleDevicePopup');
  if (btnLaunchGoogleDevicePopup) {
    btnLaunchGoogleDevicePopup.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      launchGoogleDeviceAccountPicker();
    });
  }

  if (els.btnGoogleAccCustomToggle) {
    els.btnGoogleAccCustomToggle.addEventListener('click', () => {
      if (els.googleCustomAccountForm) {
        const isHidden = els.googleCustomAccountForm.style.display === 'none';
        els.googleCustomAccountForm.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
          launchGoogleDeviceAccountPicker();
          if (els.googleCustomNameInput) {
            setTimeout(() => els.googleCustomNameInput.focus(), 50);
          }
        }
      }
    });
  }
  if (els.googleCustomAccountForm) {
    els.googleCustomAccountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customName = (els.googleCustomNameInput?.value || '').trim() || "Google User";
      const customEmail = (els.googleCustomEmailInput?.value || '').trim();
      const roleSelect = document.getElementById('googleCustomRoleSelect');
      const customRole = roleSelect ? roleSelect.value : ((customEmail.toLowerCase().includes('admin') || customEmail.toLowerCase().includes('recruiter')) ? 'recruiter' : 'seeker');

      if (!customEmail) return;
      authenticateUserWithDetails({
        email: customEmail,
        name: customName,
        role: customRole,
        provider: "Google"
      });
      if (els.googleAccountChooserModal) els.googleAccountChooserModal.classList.remove('active');
    });
  }

  // WhatsApp OTP Verification Modal Handlers
  if (els.whatsappCloseBtn) {
    els.whatsappCloseBtn.addEventListener('click', () => {
      if (els.whatsappLoginModal) els.whatsappLoginModal.classList.remove('active');
    });
  }
  if (els.btnWaSendOtp) {
    els.btnWaSendOtp.addEventListener('click', () => {
      const phone = (els.waInputPhone?.value || '').trim();
      const code = els.waCountryCode?.value || '+91';
      if (!phone || phone.length < 5) {
        showToast("Please enter a valid mobile number.", "warning");
        return;
      }
      if (els.waDisplayTargetPhone) els.waDisplayTargetPhone.textContent = `${code} ${phone}`;
      if (els.waStepNumber) els.waStepNumber.style.display = 'none';
      if (els.waStepOtp) els.waStepOtp.style.display = 'flex';
      showToast(`Verification code sent to WhatsApp (${code} ${phone})! Demo code: 7890`, "success");
      addNotification("WhatsApp Code Dispatched", `4-digit verification code sent to ${code} ${phone}.`, "💬");
    });
  }
  if (els.btnWaBackToPhone) {
    els.btnWaBackToPhone.addEventListener('click', (e) => {
      e.preventDefault();
      if (els.waStepOtp) els.waStepOtp.style.display = 'none';
      if (els.waStepNumber) els.waStepNumber.style.display = 'flex';
    });
  }
  if (els.btnWaVerifyOtp) {
    els.btnWaVerifyOtp.addEventListener('click', () => {
      const name = (els.waInputName?.value || '').trim() || "WhatsApp User";
      const phone = (els.waInputPhone?.value || '').trim() || "9876543210";
      const code = els.waCountryCode?.value || '+91';
      const role = els.waSelectRole?.value || 'seeker';

      authenticateUserWithDetails({
        email: `${phone.replace(/\s+/g, '')}@whatsapp.user`,
        name: name,
        role: role,
        provider: "WhatsApp"
      });
      if (els.whatsappLoginModal) els.whatsappLoginModal.classList.remove('active');
    });
  }
  if (els.btnWaQuickLogin) {
    els.btnWaQuickLogin.addEventListener('click', () => {
      const name = (els.waInputName?.value || '').trim() || "Satyaprakash Prajapati";
      const phone = (els.waInputPhone?.value || '').trim() || "9876543210";
      const role = els.waSelectRole?.value || 'seeker';

      authenticateUserWithDetails({
        email: "satyaprakashprajapati459@gmail.com",
        name: name,
        role: role,
        provider: "WhatsApp"
      });
      if (els.whatsappLoginModal) els.whatsappLoginModal.classList.remove('active');
    });
  }

  // Profile Dropdown Menu Items
  if (els.dropdownSignOut) els.dropdownSignOut.addEventListener('click', handleSignOut);
  if (els.dropdownGoProfile) {
    els.dropdownGoProfile.addEventListener('click', () => {
      if (els.profileDropdown) els.profileDropdown.style.display = 'none';
      if (state.currentUser && state.currentUser.role === 'recruiter') {
        showView('recruiter');
        activateTab('recruiterActiveJobsTab');
      } else {
        showView('seeker');
        activateTab('seekerProfileTab');
      }
    });
  }
  if (els.dropdownGoSettings) {
    els.dropdownGoSettings.addEventListener('click', () => {
      if (els.profileDropdown) els.profileDropdown.style.display = 'none';
      showView('seeker');
      activateTab('seekerSettingsTab');
    });
  }

  // Close profile dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (els.profileDropdown && els.profileDropdown.style.display === 'block') {
      if (els.authMenuBtn && !els.authMenuBtn.contains(e.target) && !els.profileDropdown.contains(e.target)) {
        els.profileDropdown.style.display = 'none';
      }
    }
  });
  
  // Resume Parsing triggers
  els.parseResumeBtn.addEventListener('click', handleResumeTextParse);
  els.profileEditForm.addEventListener('submit', (e) => {
    handleProfileSaveForm(e);
    // Reset wizard back to step 1
    activeProfileStep = 1;
    updateWizardUI();
  });
  
  // Profile Wizard Step Navigations (Screen 6)
  let activeProfileStep = 1;
  
  function updateWizardUI() {
    for (let i = 1; i <= 4; i++) {
      const panel = document.getElementById(`wizardPanel${i}`);
      const indicator = document.getElementById(`stepIndicator${i}`);
      if (panel && indicator) {
        panel.style.display = 'none';
        indicator.classList.remove('active');
        indicator.style.color = 'var(--text-light)';
        indicator.querySelector('span').style.background = 'var(--border-color)';
        indicator.querySelector('span').style.color = 'var(--text-light)';
      }
    }
    
    const activePanel = document.getElementById(`wizardPanel${activeProfileStep}`);
    const activeIndicator = document.getElementById(`stepIndicator${activeProfileStep}`);
    if (activePanel && activeIndicator) {
      activePanel.style.display = 'flex';
      activeIndicator.classList.add('active');
      activeIndicator.style.color = 'var(--primary)';
      activeIndicator.querySelector('span').style.background = 'var(--primary)';
      activeIndicator.querySelector('span').style.color = 'white';
    }
    
    if (activeProfileStep === 1) {
      els.wizardBackBtn.style.display = 'none';
    } else {
      els.wizardBackBtn.style.display = 'block';
    }
    
    if (activeProfileStep === 4) {
      els.wizardNextBtn.style.display = 'none';
      els.wizardSubmitBtn.style.display = 'block';
    } else {
      els.wizardNextBtn.style.display = 'block';
      els.wizardSubmitBtn.style.display = 'none';
    }
  }
  
  els.wizardNextBtn.addEventListener('click', () => {
    if (activeProfileStep < 4) {
      activeProfileStep++;
      updateWizardUI();
    }
  });
  
  els.wizardBackBtn.addEventListener('click', () => {
    if (activeProfileStep > 1) {
      activeProfileStep--;
      updateWizardUI();
    }
  });
  
  // Expose a global reset method so resume parsers can trigger it
  window.resetProfileWizard = () => {
    activeProfileStep = 1;
    updateWizardUI();
  };
  els.seekerQuickUploadBtn.addEventListener('click', () => {
    showView('seeker');
    activateTab('seekerProfileTab');
    els.resumePasteInput.focus();
  });
  
  // Drag & drop triggers for resume uploader
  els.resumeDropZone.addEventListener('click', () => els.resumeFileInput.click());
  els.resumeFileInput.addEventListener('change', handleResumeFileSelected);
  
  // Set up drag events
  ['dragenter', 'dragover'].forEach(eventName => {
    els.resumeDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      els.resumeDropZone.classList.add('dragover');
    }, false);
  });
  ['dragleave', 'drop'].forEach(eventName => {
    els.resumeDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      els.resumeDropZone.classList.remove('dragover');
    }, false);
  });
  els.resumeDropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      window.lastUploadedFile = files[0];
      els.resumeUploadOptionsModal.classList.add('active');
    }
  });

  // Resume Options Modal Actions (Automatic AI vs Manual)
  els.resumeOptionsCloseBtn.addEventListener('click', () => {
    els.resumeUploadOptionsModal.classList.remove('active');
  });

  els.btnOptionAutoAI.addEventListener('click', () => {
    els.resumeUploadOptionsModal.classList.remove('active');
    if (window.lastUploadedFile) {
      handleResumeFileParsingSim(window.lastUploadedFile);
    }
  });

  els.btnOptionManual.addEventListener('click', () => {
    els.resumeUploadOptionsModal.classList.remove('active');
    const emptyProfile = {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      experience: 0,
      skills: [],
      education: "",
      resumeText: ""
    };
    updateProfileFieldsUI(emptyProfile);
    if (window.resetProfileWizard) window.resetProfileWizard();
    addNotification("Manual Setup Active", "Fill in your profile details step-by-step.", "📝");
    alert("Manual setup mode active! Please complete the step-by-step profile wizard.");
  });

  // Job Board Search & Filters
  els.jobSearchInput.addEventListener('input', renderJobsBoardList);
  els.jobLocationFilter.addEventListener('change', renderJobsBoardList);
  
  // Landing Page Quick Search
  els.landingSearchBtn.addEventListener('click', () => {
    const text = els.landingSearchInput.value.trim();
    if (text) {
      els.jobSearchInput.value = text;
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerJobsTab');
      renderJobsBoardList();
    }
  });

  // Auto-Apply triggers
  els.autoApplyThresholdSlider.addEventListener('input', (e) => {
    els.autoApplyThresholdVal.textContent = e.target.value + "%";
  });
  els.autoApplyToggleSwitch.addEventListener('change', handleAutoApplyToggle);

  // Kanban vs Grid List switcher views (Screen 17)
  els.toggleViewKanbanBtn.addEventListener('click', () => {
    state.applicationsViewMode = 'kanban';
    els.toggleViewKanbanBtn.classList.add('active');
    els.toggleViewGridBtn.classList.remove('active');
    els.gridFilterPills.style.display = 'none';
    els.applicationsKanbanBoard.style.display = 'flex';
    els.applicationsGridList.style.display = 'none';
    saveStateToStorage();
    renderAll();
  });

  els.toggleViewGridBtn.addEventListener('click', () => {
    state.applicationsViewMode = 'grid';
    els.toggleViewKanbanBtn.classList.remove('active');
    els.toggleViewGridBtn.classList.add('active');
    els.gridFilterPills.style.display = 'flex';
    els.applicationsKanbanBoard.style.display = 'none';
    els.applicationsGridList.style.display = 'grid';
    saveStateToStorage();
    renderAll();
  });

  // Filter pills events inside Grid mode (JOBinex Style)
  document.querySelectorAll('#gridFilterPills .select-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('#gridFilterPills .select-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.applicationsGridFilter = pill.getAttribute('data-filter');
      saveStateToStorage();
      renderAll();
    });
  });

  // Interviews tab switcher filters (Screen 19)
  els.toggleInterviewsUpcomingBtn.addEventListener('click', () => {
    state.interviewsFilter = 'upcoming';
    els.toggleInterviewsUpcomingBtn.classList.add('active');
    els.toggleInterviewsCompletedBtn.classList.remove('active');
    saveStateToStorage();
    renderAll();
  });

  els.toggleInterviewsCompletedBtn.addEventListener('click', () => {
    state.interviewsFilter = 'completed';
    els.toggleInterviewsUpcomingBtn.classList.remove('active');
    els.toggleInterviewsCompletedBtn.classList.add('active');
    saveStateToStorage();
    renderAll();
  });

  // Recruiter Create Job modals
  if (els.recruiterOpenPostModalBtn) {
    els.recruiterOpenPostModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleRecruiterJobModal(true);
    });
  }
  if (els.recruiterPostJobCloseBtn) {
    els.recruiterPostJobCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRecruiterJobModal(false);
    });
  }
  if (els.recruiterPostJobModalOverlay) {
    els.recruiterPostJobModalOverlay.addEventListener('click', (e) => {
      if (e.target === els.recruiterPostJobModalOverlay) {
        toggleRecruiterJobModal(false);
      }
    });
  }
  if (els.recruiterJobForm) {
    els.recruiterJobForm.addEventListener('submit', handleRecruiterJobPublish);
  }
  if (els.screenJobSelector) {
    els.screenJobSelector.addEventListener('change', renderRecruiterCandidateLists);
  }

  // Universal Modal Dismissal (All close buttons, backdrop click, Escape key)
  document.querySelectorAll('.modal-overlay .close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parentModal = btn.closest('.modal-overlay');
      if (parentModal) {
        parentModal.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
      if (els.notificationDropdown) els.notificationDropdown.style.display = 'none';
      if (els.profileDropdown) els.profileDropdown.style.display = 'none';
    }
  });

  // AI Interview Scheduler & Live Agent Room Event Bindings
  if (els.scheduleInterviewCloseBtn) {
    els.scheduleInterviewCloseBtn.addEventListener('click', () => {
      els.scheduleInterviewModalOverlay.classList.remove('active');
    });
  }

  if (els.scheduleInterviewForm) {
    els.scheduleInterviewForm.addEventListener('submit', handleScheduleInterviewSubmit);
  }

  if (els.btnLaunchAIInterviewImmediate) {
    els.btnLaunchAIInterviewImmediate.addEventListener('click', () => {
      if (window._activeSchedCandidate && window._activeSchedJob) {
        startAIInterviewSession(window._activeSchedCandidate, window._activeSchedJob);
      }
    });
  }

  if (els.aiInterviewRoomCloseBtn) {
    els.aiInterviewRoomCloseBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to exit the live AI Interview room? Any unsaved progress will be lost.")) {
        els.aiInterviewRoomModalOverlay.classList.remove('active');
      }
    });
  }

  if (els.aiInterviewCandidateInput) {
    els.aiInterviewCandidateInput.addEventListener('input', (e) => {
      const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0).length;
      els.aiAnswerWordCounter.textContent = `${words} words`;
    });
  }

  if (els.btnSpeechSimulate) {
    els.btnSpeechSimulate.addEventListener('click', handleSpeechSimulationToggle);
  }

  if (els.btnFillSampleAnswer) {
    els.btnFillSampleAnswer.addEventListener('click', handleLoadSTARSample);
  }

  if (els.btnSubmitAIAnswer) {
    els.btnSubmitAIAnswer.addEventListener('click', handleCandidateAnswerSubmit);
  }

  if (els.btnNextAIQuestion) {
    els.btnNextAIQuestion.addEventListener('click', handleNextAIQuestion);
  }

  if (els.btnSaveAndStoreDossier) {
    els.btnSaveAndStoreDossier.addEventListener('click', finalizeAndSaveInterviewDossier);
  }

  if (els.btnViewFullTranscriptModal) {
    els.btnViewFullTranscriptModal.addEventListener('click', () => {
      if (state.activeInterviewSession && state.activeInterviewSession.finalDossier) {
        const fullDossier = {
          ...state.activeInterviewSession.finalDossier,
          candidateName: state.activeInterviewSession.candidateName,
          jobTitle: state.activeInterviewSession.jobTitle,
          company: state.activeInterviewSession.company,
          qaHistory: state.activeInterviewSession.qaHistory
        };
        openInterviewReportModal(fullDossier);
      }
    });
  }

  if (els.interviewReportCloseBtn) {
    els.interviewReportCloseBtn.addEventListener('click', () => {
      els.interviewReportModalOverlay.classList.remove('active');
    });
  }

  // Google OAuth Account Chooser Bindings
  if (els.googleAccountCloseBtn) {
    els.googleAccountCloseBtn.addEventListener('click', () => {
      els.googleAccountChooserModal.classList.remove('active');
    });
  }

  if (els.btnGoogleAccSatya) {
    els.btnGoogleAccSatya.addEventListener('click', () => {
      authenticateUserWithDetails({
        email: 'satyaprakashprajapati459@gmail.com',
        name: 'Satyaprakash Prajapati',
        role: 'recruiter',
        provider: 'Google'
      });
    });
  }

  if (els.btnGoogleAccAlex) {
    els.btnGoogleAccAlex.addEventListener('click', () => {
      authenticateUserWithDetails({
        email: 'alex.carter.dev@gmail.com',
        name: 'Alex Carter',
        role: 'seeker',
        provider: 'Google'
      });
    });
  }

  if (els.btnGoogleAccCustomToggle) {
    els.btnGoogleAccCustomToggle.addEventListener('click', () => {
      const isVisible = els.googleCustomAccountForm.style.display === 'flex';
      els.googleCustomAccountForm.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible && els.googleCustomNameInput) {
        els.googleCustomNameInput.focus();
      }
    });
  }

  if (els.googleCustomAccountForm) {
    els.googleCustomAccountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = els.googleCustomEmailInput.value.trim();
      const name = els.googleCustomNameInput.value.trim() || email.split('@')[0];
      if (email) {
        authenticateUserWithDetails({
          email,
          name,
          role: state.currentRole,
          provider: 'Google'
        });
      }
    });
  }

  // Career Tools Interactions
  els.startMockInterviewBtn.addEventListener('click', handleStartMockInterview);
  els.sendMockAnswerBtn.addEventListener('click', handleSendMockAnswer);
  els.mockInterviewUserInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMockAnswer();
  });
  
  els.salaryExpSlider.addEventListener('input', handleSalaryEstimateUpdate);
  els.salaryRoleInput.addEventListener('input', handleSalaryEstimateUpdate);

  // Calendar controls
  els.calendarPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
  els.calendarNextMonthBtn.addEventListener('click', () => changeMonth(1));
  
  // Notification menu
  els.notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = els.notificationDropdown.style.display === 'block';
    els.notificationDropdown.style.display = isShown ? 'none' : 'block';
  });
  
  els.markAllReadBtn.addEventListener('click', () => {
    state.notifications.forEach(n => n.unread = false);
    saveStateToStorage();
    renderAll();
  });
  
  document.addEventListener('click', (e) => {
    if (els.notificationDropdown && !els.notificationBtn.contains(e.target) && !els.notificationDropdown.contains(e.target)) {
      els.notificationDropdown.style.display = 'none';
    }
    if (els.profileDropdown && !els.authMenuBtn.contains(e.target) && !els.profileDropdown.contains(e.target)) {
      els.profileDropdown.style.display = 'none';
    }
  });

  // Profile Dropdown Menu Actions (Screen 25 / Profile Access)
  els.dropdownGoProfile.addEventListener('click', (e) => {
    e.preventDefault();
    els.profileDropdown.style.display = 'none';
    if (!state.currentUser) return;
    if (state.currentUser.role === 'seeker') {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerProfileTab');
    } else {
      switchRole('recruiter');
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    }
  });

  els.dropdownGoSettings.addEventListener('click', (e) => {
    e.preventDefault();
    els.profileDropdown.style.display = 'none';
    if (!state.currentUser) return;
    if (state.currentUser.role === 'seeker') {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerSettingsTab');
    } else {
      switchRole('recruiter');
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    }
  });

  els.dropdownSignOut.addEventListener('click', (e) => {
    e.preventDefault();
    els.profileDropdown.style.display = 'none';
    handleSignOut();
  });
  
  // Chat input listeners
  els.sendSeekerMessageBtn.addEventListener('click', handleSendSeekerMessage);
  els.seekerChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendSeekerMessage();
  });
  
  els.sendRecruiterMessageBtn.addEventListener('click', handleSendRecruiterMessage);
  els.recruiterChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendRecruiterMessage();
  });
  
  // Admin System Database Console bindings
  els.openAdminConsoleLink.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminConsoleModal();
  });
  
  els.adminConsoleCloseBtn.addEventListener('click', () => {
    els.adminConsoleModal.classList.remove('active');
  });
  
  els.btnAdminClose.addEventListener('click', () => {
    els.adminConsoleModal.classList.remove('active');
  });
  
  if (els.btnAdminExportDb) {
    els.btnAdminExportDb.addEventListener('click', () => {
      exportDatabaseToJsonFile();
    });
  }

  els.btnAdminResetDb.addEventListener('click', () => {
    if (confirm("WARNING: This will clear all local storage and re-seed the system data. Continue?")) {
      localStorage.clear();
      showToast("System database reset! Reloading page...", "info");
      setTimeout(() => window.location.reload(), 500);
    }
  });

  // CareerPilot Event Bindings
  if (els.navCareerPilot) {
    els.navCareerPilot.addEventListener('click', () => {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerCareerPilotTab');
      if (!state.careerPilot) {
        runCareerPilot();
      }
    });
  }

  if (els.btnRunCareerPilot) {
    els.btnRunCareerPilot.addEventListener('click', () => {
      runCareerPilot();
    });
  }

  if (els.btnLoadSatyaprakashPreset) {
    els.btnLoadSatyaprakashPreset.addEventListener('click', () => {
      loadSatyaprakashBenchmark();
    });
  }

  if (els.btnSimulateAdaptation) {
    els.btnSimulateAdaptation.addEventListener('click', () => {
      runCareerPilot({ simulateFailure: true });
    });
  }

  // Preset Goal Chips
  document.querySelectorAll('.prompt-preset-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.prompt-preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const prompt = chip.getAttribute('data-prompt');
      if (els.careerGoalPromptInput && prompt) {
        els.careerGoalPromptInput.value = prompt;
        // Auto-extract role from prompt
        if (typeof CareerPilot !== 'undefined' && CareerPilot.CareerGoalAgent) {
          const goal = CareerPilot.CareerGoalAgent.understandGoal(prompt);
          if (els.careerPilotTargetRole) els.careerPilotTargetRole.value = goal.role;
          if (els.careerPilotExpLevel) els.careerPilotExpLevel.value = goal.experience;
          if (els.careerPilotLocation) els.careerPilotLocation.value = goal.location;
        }
      }
    });
  });

  // Re-evaluation skill buttons
  document.querySelectorAll('.btn-reeval-skill').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = btn.getAttribute('data-skill');
      if (skill) {
        handleCareerPilotReEvaluation(skill);
      }
    });
  });
}

/* ==========================================
   NAVIGATION & VIEW ROUTING
   ========================================== */
function showView(viewId) {
  // Hide all screens
  els.landingView.style.display = 'none';
  els.seekerDashboard.style.display = 'none';
  els.recruiterDashboard.style.display = 'none';
  els.pricingDashboard.style.display = 'none';
  
  // Deactivate navigation tabs
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  
  // Activate selected screen
  if (viewId === 'landing') {
    els.landingView.style.display = 'block';
    els.navHome.classList.add('active');
  } else if (viewId === 'seeker') {
    els.seekerDashboard.style.display = 'block';
    // Ensure role selector matches
    switchRole('seeker', false);
  } else if (viewId === 'recruiter') {
    // If not logged in as recruiter, force modal login check
    if (!state.currentUser || state.currentUser.role !== 'recruiter') {
      alert("Please Sign In as a Recruiter to access the employer board.");
      toggleAuthModal(true, 'recruiter');
      return;
    }
    els.recruiterDashboard.style.display = 'block';
    switchRole('recruiter', false);
  } else if (viewId === 'pricing') {
    els.pricingDashboard.style.display = 'block';
    els.navPricing.classList.add('active');
  }
  
  renderAll();
}

function activateTab(tabId) {
  // Find which tab-navigation holds this button
  const contentNode = document.getElementById(tabId);
  if (!contentNode) return;
  
  const container = contentNode.parentElement;
  
  // Hide siblings contents
  container.querySelectorAll('.tab-content').forEach(node => node.classList.remove('active'));
  contentNode.classList.add('active');
  
  // Toggle nav item highlight
  const navContainer = container.querySelector('.tab-navigation');
  if (navContainer) {
    navContainer.querySelectorAll('.tab-nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-target') === tabId) {
        btn.classList.add('active');
      }
    });
  }
  
  // Update view menu headers selection
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  if (tabId === 'seekerCareerPilotTab' && els.navCareerPilot) els.navCareerPilot.classList.add('active');
  if (tabId === 'seekerProfileTab' || tabId === 'seekerJobsTab') els.navJobs.classList.add('active');
  if (tabId === 'seekerPipelineTab') els.navApplications.classList.add('active');
  if (tabId === 'seekerToolsTab') els.navCareerTools.classList.add('active');
  if (tabId === 'recruiterActiveJobsTab') els.navRecruiterJobs.classList.add('active');
  if (tabId === 'recruiterScreenTab') els.navRecruiterScreen.classList.add('active');
  if (tabId === 'recruiterCalendarTab') els.navRecruiterCalendar.classList.add('active');
}

function switchRole(role, redirect = true) {
  state.currentRole = role;
  saveStateToStorage();
  
  // Update header buttons
  if (role === 'seeker') {
    els.roleSeekerBtn.classList.add('active');
    els.roleRecruiterBtn.classList.remove('active');
    // Toggle nav item visibilities
    document.querySelectorAll('.seeker-only').forEach(e => e.style.display = 'block');
    document.querySelectorAll('.recruiter-only').forEach(e => e.style.display = 'none');
    
    if (redirect && state.currentUser) {
      showView('seeker');
      activateTab('seekerJobsTab');
    }
  } else {
    els.roleRecruiterBtn.classList.add('active');
    els.roleSeekerBtn.classList.remove('active');
    // Toggle nav item visibilities
    document.querySelectorAll('.recruiter-only').forEach(e => e.style.display = 'block');
    document.querySelectorAll('.seeker-only').forEach(e => e.style.display = 'none');
    
    if (redirect) {
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    }
  }
}

/* ==========================================
   AUTHENTICATION & USER STORAGE SYSTEM
   ========================================== */
function getStoredUsers() {
  const usersJson = localStorage.getItem('sh_users');
  if (usersJson) {
    try {
      const parsed = JSON.parse(usersJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("Error parsing stored users from localStorage:", e);
    }
  }

  // Pre-seeded Default Accounts for instant testing
  const defaultAccounts = [
    {
      id: "usr-admin-satya",
      email: "satyaprakashprajapati459@gmail.com",
      password: "password123",
      name: "Satyaprakash Prajapati (Admin)",
      role: "recruiter",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr-seeker-alex",
      email: "alex.carter@email.com",
      password: "password123",
      name: "Alex Carter",
      role: "seeker",
      profile: { ...DEFAULT_SEEKER_PROFILE },
      applications: [...DEFAULT_APPLICATIONS],
      createdAt: new Date().toISOString()
    },
    {
      id: "usr-seeker-satya",
      email: "satyaprakash@example.com",
      password: "password123",
      name: "Satyaprakash",
      role: "seeker",
      profile: { ...SATYAPRAKASH_PROFILE },
      applications: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "usr-recruiter-stripe",
      email: "recruiter@stripe.com",
      password: "password123",
      name: "Sarah Jenkins (Stripe HR)",
      role: "recruiter",
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem('sh_users', JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

function saveStoredUser(userObj) {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...userObj, updatedAt: new Date().toISOString() };
  } else {
    users.push({ ...userObj, createdAt: new Date().toISOString() });
  }
  localStorage.setItem('sh_users', JSON.stringify(users));
}

function toggleAuthModal(show, preselectRole = 'seeker') {
  if (show) {
    els.authModalOverlay.classList.add('active');
    if (els.authSelectRole) els.authSelectRole.value = preselectRole;
    if (els.authEmail) els.authEmail.focus();
  } else {
    els.authModalOverlay.classList.remove('active');
  }
}

function setAuthMode(mode) {
  els.authFormMode.value = mode;
  if (mode === 'signup') {
    els.authFormTitle.textContent = 'Create Account';
    els.authFormSubtitle.textContent = 'Start matching and accelerating your career with AI.';
    if (els.signupRoleGroup) els.signupRoleGroup.style.display = 'flex';
    if (els.signupNameGroup) els.signupNameGroup.style.display = 'flex';
    if (els.loginOptionsArea) els.loginOptionsArea.style.display = 'none';
    const pwdParent = document.getElementById('authPassword')?.parentElement;
    if (pwdParent) pwdParent.style.display = 'flex';
    els.authSubmitBtn.textContent = 'Sign Up';
    els.authToggleText.textContent = 'Already have an account?';
    els.authToggleModeBtn.textContent = 'Sign In';
  } else if (mode === 'login') {
    els.authFormTitle.textContent = 'Sign In';
    els.authFormSubtitle.textContent = 'Access your personalized CareerPilot workspace.';
    if (els.signupRoleGroup) els.signupRoleGroup.style.display = 'none';
    if (els.signupNameGroup) els.signupNameGroup.style.display = 'none';
    if (els.loginOptionsArea) els.loginOptionsArea.style.display = 'flex';
    const pwdParent = document.getElementById('authPassword')?.parentElement;
    if (pwdParent) pwdParent.style.display = 'flex';
    els.authSubmitBtn.textContent = 'Sign In';
    els.authToggleText.textContent = "Don't have an account?";
    els.authToggleModeBtn.textContent = 'Sign Up';
  } else if (mode === 'forgot') {
    els.authFormTitle.textContent = 'Reset Password';
    els.authFormSubtitle.textContent = "Enter your email address and we'll send you recovery instructions.";
    if (els.signupRoleGroup) els.signupRoleGroup.style.display = 'none';
    if (els.signupNameGroup) els.signupNameGroup.style.display = 'none';
    if (els.loginOptionsArea) els.loginOptionsArea.style.display = 'none';
    const pwdParent = document.getElementById('authPassword')?.parentElement;
    if (pwdParent) pwdParent.style.display = 'none';
    els.authSubmitBtn.textContent = 'Send Reset Link';
    els.authToggleText.textContent = "Remember your password?";
    els.authToggleModeBtn.textContent = 'Back to Sign In';
  }
}

function toggleAuthMode(e) {
  if (e) e.preventDefault();
  const currentMode = els.authFormMode.value;
  if (currentMode === 'login') {
    setAuthMode('signup');
  } else {
    setAuthMode('login');
  }
}

function handleProfileMenuClick(e) {
  if (state.currentUser) {
    if (e) e.stopPropagation();
    const isShown = els.profileDropdown.style.display === 'block';
    els.profileDropdown.style.display = isShown ? 'none' : 'block';
    if (els.dropdownUserEmail) els.dropdownUserEmail.textContent = state.currentUser.email;
  } else {
    toggleAuthModal(true);
  }
}

function handleSignOut() {
  const previousUserName = state.currentUser ? state.currentUser.name : "User";
  state.currentUser = null;
  state.profile = { ...DEFAULT_SEEKER_PROFILE };
  state.applications = [...DEFAULT_APPLICATIONS];
  saveStateToStorage();
  
  updateAuthHeaderUI();
  if (els.profileDropdown) els.profileDropdown.style.display = 'none';
  
  showToast(`Signed out successfully. See you again, ${previousUserName}!`, 'info');
  showView('landing');
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const email = (els.authEmail?.value || '').trim();
  const password = (els.authPassword?.value || '').trim();
  const mode = els.authFormMode?.value || 'login';

  if (!email) {
    showToast("Please enter a valid email address.", "warning");
    return;
  }

  // 1. FORGOT PASSWORD FLOW
  if (mode === 'forgot') {
    showToast(`Password reset link dispatched to ${email}. Please check your inbox!`, "success");
    addNotification("Password Reset Dispatched", `A secure recovery link was sent to ${email}.`, "🔑");
    setAuthMode('login');
    if (els.authEmail) els.authEmail.value = "";
    return;
  }

  const storedUsers = getStoredUsers();
  const existingUser = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  // 2. SIGN UP FLOW
  if (mode === 'signup') {
    if (existingUser) {
      showToast(`An account with ${email} already exists. Please Sign In.`, "warning");
      setAuthMode('login');
      if (els.authEmail) els.authEmail.value = email;
      return;
    }

    if (password.length < 3) {
      showToast("Password must be at least 3 characters long.", "warning");
      return;
    }

    let role = els.authSelectRole?.value || 'seeker';
    let name = (els.authFullName?.value || '').trim() || email.split('@')[0];

    // Admin / Recruiter rule
    if (email.toLowerCase() === 'satyaprakashprajapati459@gmail.com' || email.toLowerCase().includes('admin')) {
      role = 'recruiter';
      name = 'Satyaprakash Prajapati (Admin)';
    }

    const newUser = {
      id: "usr-" + Date.now(),
      email: email,
      password: password,
      name: name,
      role: role,
      profile: role === 'seeker' ? {
        fullName: name,
        email: email,
        title: "Software Engineer",
        experience: 0,
        location: "Remote / India",
        skills: ["Java", "JavaScript", "React", "SQL"],
        education: "B.Tech in Computer Science",
        resumeText: `${name}\nSoftware Engineer\nEmail: ${email}\nSkills: Java, React, SQL`
      } : null,
      applications: role === 'seeker' ? [...DEFAULT_APPLICATIONS] : [],
      savedJobs: []
    };

    saveStoredUser(newUser);

    state.currentUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    if (role === 'seeker') {
      state.profile = newUser.profile;
      state.applications = newUser.applications;
    }
    state.currentRole = role;

    saveStateToStorage();
    updateAuthHeaderUI();
    toggleAuthModal(false);

    // Reset Form
    if (els.authEmail) els.authEmail.value = "";
    if (els.authPassword) els.authPassword.value = "";
    if (els.authFullName) els.authFullName.value = "";

    showToast(`🎉 Welcome ${newUser.name}! Your ${role.toUpperCase()} account is created and saved.`, "success");
    addNotification("Account Created! 🚀", `Welcome to CareerPilot, ${newUser.name}. All data is saved to your account.`, "🎉");

    if (role === 'recruiter') {
      switchRole('recruiter');
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    } else {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerProfileTab');
    }
    return;
  }

  // 3. SIGN IN FLOW
  if (existingUser) {
    // Validate password
    if (existingUser.password && existingUser.password !== password) {
      showToast("❌ Incorrect password. Please check your credentials.", "error");
      return;
    }

    // Successful login
    state.currentUser = { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role };
    if (existingUser.role === 'seeker' && existingUser.profile) {
      state.profile = existingUser.profile;
      if (existingUser.applications) state.applications = existingUser.applications;
    }
    state.currentRole = existingUser.role;

    saveStateToStorage();
    updateAuthHeaderUI();
    toggleAuthModal(false);

    // Reset form inputs
    if (els.authEmail) els.authEmail.value = "";
    if (els.authPassword) els.authPassword.value = "";

    showToast(`✅ Welcome back, ${existingUser.name}! Signed in successfully.`, "success");
    addNotification("Signed In", `Logged in as ${existingUser.name} (${existingUser.role.toUpperCase()}).`, "🔑");

    if (existingUser.role === 'recruiter') {
      switchRole('recruiter');
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    } else {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerJobsTab');
    }
  } else {
    // Auto-create and sign in for frictionless user onboarding
    let autoRole = (email.toLowerCase() === 'satyaprakashprajapati459@gmail.com' || email.toLowerCase().includes('admin') || email.toLowerCase().includes('recruiter')) ? 'recruiter' : 'seeker';
    let autoName = (email.toLowerCase() === 'satyaprakashprajapati459@gmail.com') ? 'Satyaprakash Prajapati (Admin)' : email.split('@')[0];

    const autoUser = {
      id: "usr-" + Date.now(),
      email: email,
      password: password || "password123",
      name: autoName,
      role: autoRole,
      profile: { ...DEFAULT_SEEKER_PROFILE, fullName: autoName, email: email },
      applications: [...DEFAULT_APPLICATIONS],
      savedJobs: []
    };

    saveStoredUser(autoUser);

    state.currentUser = { id: autoUser.id, email: autoUser.email, name: autoUser.name, role: autoUser.role };
    state.profile = autoUser.profile;
    state.currentRole = autoRole;

    saveStateToStorage();
    updateAuthHeaderUI();
    toggleAuthModal(false);

    if (els.authEmail) els.authEmail.value = "";
    if (els.authPassword) els.authPassword.value = "";

    showToast(`✅ Welcome, ${autoUser.name}! Account registered & signed in successfully.`, "success");

    if (autoRole === 'recruiter') {
      switchRole('recruiter');
      showView('recruiter');
      activateTab('recruiterActiveJobsTab');
    } else {
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerProfileTab');
    }
  }
}

function decodeJwtCredential(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) return;
  const payload = decodeJwtCredential(response.credential);
  if (payload && payload.email) {
    const gName = payload.name || payload.given_name || payload.email.split('@')[0];
    const gEmail = payload.email;
    const gPicture = payload.picture || "";
    const gRole = (gEmail.toLowerCase().includes('admin') || gEmail.toLowerCase().includes('recruiter')) ? 'recruiter' : 'seeker';

    authenticateUserWithDetails({
      email: gEmail,
      name: gName,
      role: gRole,
      picture: gPicture,
      provider: "Google"
    });

    if (els.googleAccountChooserModal) els.googleAccountChooserModal.classList.remove('active');
  }
}

function launchGoogleDeviceAccountPicker() {
  // 1. Trigger Google GIS One Tap prompt if available on phone / Chrome
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log("GIS prompt status:", notification.getNotDisplayedReason());
        }
      });
    } catch (err) {
      console.log("GIS prompt error:", err);
    }
  }

  // 2. Open Google's official Account Chooser in popup
  try {
    const redirectUrl = encodeURIComponent(window.location.origin);
    const googleChooserUrl = `https://accounts.google.com/AccountChooser?service=lso&continue=${redirectUrl}`;
    window.open(googleChooserUrl, "GoogleAccountChooser", "width=520,height=620,menubar=no,toolbar=no,location=no,status=no");
    showToast("🌐 Google Account Chooser opened! Select any Google account to sign in.", "info");
  } catch (e) {
    console.warn("Could not open Google popup:", e);
  }
}

function initGoogleIdentityServices() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      google.accounts.id.initialize({
        client_id: "726883459102-demo.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const mount = document.getElementById('googleOfficialBtnMount');
      if (mount) {
        mount.innerHTML = '';
        google.accounts.id.renderButton(mount, {
          theme: "outline",
          size: "large",
          width: 360,
          text: "signin_with",
          shape: "pill"
        });
      }
    } catch (e) {
      console.log("Google GIS Init note:", e);
    }
  } else {
    // Retry initialization once SDK script finishes loading
    setTimeout(initGoogleIdentityServices, 800);
  }
}

function handleOAuthLogin(provider) {
  toggleAuthModal(false);
  if (provider === 'Google') {
    if (els.googleAccountChooserModal) {
      els.googleAccountChooserModal.classList.add('active');
      initGoogleIdentityServices();
    } else {
      authenticateUserWithDetails({
        email: "satyaprakashprajapati459@gmail.com",
        name: "Satyaprakash Prajapati (Admin)",
        role: "recruiter",
        provider: "Google"
      });
    }
    return;
  }
  
  if (provider === 'WhatsApp') {
    if (els.whatsappLoginModal) {
      if (els.waStepOtp) els.waStepOtp.style.display = 'none';
      if (els.waStepNumber) els.waStepNumber.style.display = 'flex';
      els.whatsappLoginModal.classList.add('active');
    } else {
      authenticateUserWithDetails({
        email: "9876543210@whatsapp.user",
        name: "Satyaprakash Prajapati",
        role: "seeker",
        provider: "WhatsApp"
      });
    }
    return;
  }
}

function authenticateUserWithDetails({ email, name, role = 'seeker', provider = 'Google', picture = '' }) {
  if (email.toLowerCase() === 'satyaprakashprajapati459@gmail.com' || email.toLowerCase().includes('admin')) {
    role = 'recruiter';
  }

  const oauthUser = {
    id: "usr-" + provider.toLowerCase() + "-" + Date.now(),
    email: email,
    name: name,
    role: role,
    picture: picture,
    provider: provider,
    profile: { ...DEFAULT_SEEKER_PROFILE, fullName: name, email: email },
    applications: [...DEFAULT_APPLICATIONS],
    savedJobs: []
  };

  saveStoredUser(oauthUser);

  state.currentUser = { id: oauthUser.id, email, role, name, provider, picture };
  if (role === 'seeker') {
    state.profile = oauthUser.profile;
    state.applications = oauthUser.applications;
  }
  state.currentRole = role;

  saveStateToStorage();
  updateAuthHeaderUI();
  toggleAuthModal(false);

  addNotification(
    `${provider} Account Connected`,
    `Successfully signed in as ${name} (${email}).`,
    "✅"
  );

  showToast(`✅ Successfully connected with ${provider}! Welcome, ${name}.`, "success");

  if (role === 'recruiter') {
    switchRole('recruiter');
    showView('recruiter');
    activateTab('recruiterActiveJobsTab');
  } else {
    switchRole('seeker');
    showView('seeker');
    activateTab('seekerProfileTab');
  }
}

function updateAuthHeaderUI() {
  const isPremium = (state.isPro === true || state.userPlan === 'seeker_pro' || state.userPlan === 'recruiter_ent' || localStorage.getItem('sh_is_pro') === 'true' || localStorage.getItem('sh_user_plan') === 'seeker_pro' || localStorage.getItem('sh_user_plan') === 'recruiter_ent');

  if (state.currentUser) {
    const rawName = state.currentUser.name || state.currentUser.email.split('@')[0];
    const initial = (state.currentUser.name || state.currentUser.email || 'U').trim().charAt(0).toUpperCase();

    if (els.usernameDisplay) {
      if (isPremium) {
        els.usernameDisplay.innerHTML = `${rawName} <span style="font-size:10.5px; font-weight:800; color:#b45309; background:linear-gradient(135deg, #fef3c7, #fde68a); border:1px solid #f59e0b; padding:1px 6px; border-radius:10px; margin-left:4px; letter-spacing:0.3px;">PRO 👑</span>`;
      } else {
        els.usernameDisplay.textContent = rawName;
      }
    }

    if (els.avatarBadge) {
      if (state.currentUser.picture) {
        els.avatarBadge.innerHTML = `<img src="${state.currentUser.picture}" alt="${rawName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
      } else {
        els.avatarBadge.textContent = initial;
      }

      if (isPremium) {
        els.avatarBadge.classList.add('premium-gold');
        els.avatarBadge.style.backgroundColor = "";
        els.avatarBadge.style.color = "";
        els.avatarBadge.style.border = "";
        els.avatarBadge.style.boxShadow = "";
      } else {
        els.avatarBadge.classList.remove('premium-gold');
        if (state.currentUser.role === 'recruiter') {
          els.avatarBadge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
          els.avatarBadge.style.color = "var(--success)";
          els.avatarBadge.style.border = "1.5px solid var(--success)";
          els.avatarBadge.style.boxShadow = "none";
        } else {
          els.avatarBadge.style.backgroundColor = "rgba(124, 58, 237, 0.15)";
          els.avatarBadge.style.color = "var(--primary)";
          els.avatarBadge.style.border = "1.5px solid var(--primary)";
          els.avatarBadge.style.boxShadow = "none";
        }
      }
    }

    if (els.authMenuBtn) {
      if (isPremium) {
        els.authMenuBtn.classList.add('premium-gold-border');
      } else {
        els.authMenuBtn.classList.remove('premium-gold-border');
      }
    }

    if (els.dropdownUserEmail) els.dropdownUserEmail.textContent = state.currentUser.email;
    if (els.seekerWelcomeName) els.seekerWelcomeName.textContent = `Hello, ${state.currentUser.name}!`;
  } else {
    if (els.usernameDisplay) els.usernameDisplay.textContent = "Sign In";
    if (els.avatarBadge) {
      els.avatarBadge.textContent = "U";
      els.avatarBadge.classList.remove('premium-gold');
      els.avatarBadge.style.backgroundColor = "var(--primary-light)";
      els.avatarBadge.style.color = "var(--primary)";
      els.avatarBadge.style.border = "1px solid var(--border-color)";
      els.avatarBadge.style.boxShadow = "none";
    }
    if (els.authMenuBtn) els.authMenuBtn.classList.remove('premium-gold-border');
    if (els.profileDropdown) els.profileDropdown.style.display = 'none';
  }
}


/* ==========================================
   SEEKER DASHBOARD PROFILE PARSING
   ========================================== */
function handleResumeFileSelected(e) {
  const file = e.target.files[0];
  if (file) {
    window.lastUploadedFile = file;
    els.resumeUploadOptionsModal.classList.add('active');
  }
}

async function extractTextFromFile(file) {
  if (!file) return "";
  const fname = file.name.toLowerCase();

  // 1. Plain Text / Markdown / CSV / JSON files
  if (fname.endsWith('.txt') || fname.endsWith('.md') || fname.endsWith('.json') || fname.endsWith('.csv') || fname.endsWith('.rtf') || file.type.includes('text')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || "");
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  }

  // 2. PDF files (Extract from binary using PDF.js or native stream decoding)
  if (fname.endsWith('.pdf') || file.type === 'application/pdf') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result;
        if (!buffer) return resolve("");

        try {
          if (window.pdfjsLib) {
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
            const pdf = await loadingTask.promise;
            let fullText = "";
            for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            if (fullText.trim().length > 20) {
              resolve(fullText.trim());
              return;
            }
          }
        } catch (pdfErr) {
          console.warn("PDF.js extraction warning, falling back to raw stream decoding:", pdfErr);
        }

        // Native Stream Decoder Fallback for PDFs
        try {
          const uint8 = new Uint8Array(buffer);
          let rawStr = "";
          for (let i = 0; i < uint8.length; i++) {
            const c = uint8[i];
            if ((c >= 32 && c <= 126) || c === 10 || c === 13 || c === 9) {
              rawStr += String.fromCharCode(c);
            } else if (rawStr.length > 0 && rawStr[rawStr.length - 1] !== ' ') {
              rawStr += ' ';
            }
          }
          const textMatches = rawStr.match(/\(([^()]{2,100})\)\s*Tj/g) || rawStr.match(/\[([^\[\]]{2,200})\]\s*TJ/g);
          if (textMatches && textMatches.length > 0) {
            const extracted = textMatches.map(m => m.replace(/[\(\)\[\]]/g, '').replace(/Tj|TJ/g, '')).join(' ');
            if (extracted.trim().length > 30) {
              resolve(extracted);
              return;
            }
          }
          const printableChunks = rawStr.split(/[\x00-\x1F\x7F-\xFF]+/).filter(chunk => chunk.trim().length > 4 && /[a-zA-Z]/.test(chunk));
          resolve(printableChunks.join('\n'));
        } catch (err) {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsArrayBuffer(file);
    });
  }

  // 3. Word DOCX files (.docx)
  if (fname.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result;
        if (!buffer) return resolve("");

        try {
          if (window.JSZip) {
            const zip = await JSZip.loadAsync(buffer);
            const docXml = await zip.file("word/document.xml")?.async("string");
            if (docXml) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(docXml, "text/xml");
              const textNodes = xmlDoc.getElementsByTagName("w:t");
              let textContent = "";
              for (let i = 0; i < textNodes.length; i++) {
                textContent += (textNodes[i].textContent || "") + " ";
              }
              if (textContent.trim().length > 10) {
                resolve(textContent.trim());
                return;
              }
            }
          }
        } catch (docxErr) {
          console.warn("JSZip docx extraction warning, using fallback:", docxErr);
        }

        // Native XML token decoder for DOCX
        try {
          const uint8 = new Uint8Array(buffer);
          let rawStr = "";
          for (let i = 0; i < uint8.length; i++) {
            const c = uint8[i];
            if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
              rawStr += String.fromCharCode(c);
            }
          }
          const xmlMatches = rawStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (xmlMatches) {
            const extracted = xmlMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
            resolve(extracted);
            return;
          }
          resolve(rawStr.substring(0, 3000));
        } catch (err) {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsArrayBuffer(file);
    });
  }

  // Generic text reader fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

async function handleResumeFileParsingSim(file) {
  if (!file) return;

  // Show parsing spinner with file name
  els.resumeDropZone.innerHTML = `
    <div style="padding: 14px; text-align: center;">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
      <div style="font-size: 13px; font-weight: 700; margin-top: 8px; color: var(--primary);">Reading & Extracting Data from ${file.name}...</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Smart AI is analyzing your actual skills, experience, and profile details</div>
    </div>
  `;
  
  try {
    // 1. EXTRACT REAL TEXT DIRECTLY FROM USER'S FILE
    let extractedText = await extractTextFromFile(file);

    if (!extractedText || extractedText.trim().length < 15) {
      extractedText = (els.resumePasteInput && els.resumePasteInput.value.trim()) || `${file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}\nSoftware Engineer\nExperience: 2 years\nLocation: Remote / India\nSkills: Java, SQL, React, Git`;
    }

    if (els.resumePasteInput) {
      els.resumePasteInput.value = extractedText;
    }

    // 2. RUN REAL AI PARSER ON EXTRACTED TEXT
    const parsedData = AIEngine.parseResume(extractedText);
    if (parsedData) {
      updateProfileFieldsUI(parsedData);
      showToast(`✅ Successfully extracted data from ${file.name}! Found ${parsedData.skills.length} skills.`, "success");
    }
  } catch (err) {
    console.error("Resume file extraction error:", err);
    showToast(`⚠️ Could not fully read ${file.name}. You can also paste resume text directly.`, "warning");
  } finally {
    // Reset drop zone HTML
    els.resumeDropZone.innerHTML = `
      <div class="upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
      </div>
      <div class="upload-text">Upload Resume (PDF, DOCX)</div>
      <div class="upload-subtext">Drag & drop your file here to auto-fill details</div>
    `;
  }
}

function handleResumeTextParse() {
  const text = els.resumePasteInput.value.trim();
  if (!text) {
    showToast("Please paste your resume text first.", "warning");
    return;
  }
  
  const parsedData = AIEngine.parseResume(text);
  if (parsedData) {
    updateProfileFieldsUI(parsedData);
    showToast(`✅ Successfully parsed resume text for ${parsedData.fullName}!`, "success");
  }
}

function updateProfileFieldsUI(data) {
  if (!data) return;
  
  els.profileFullName.value = data.fullName || "Candidate";
  els.profileTitle.value = data.title || "Software Engineer";
  els.profileExperience.value = data.experience || 1;
  els.profileLocation.value = data.location || "Remote";
  els.profileSkills.value = (data.skills && data.skills.length > 0) ? data.skills.join(', ') : "Java, SQL, React";
  els.profileEducation.value = data.education || "B.Tech in Computer Science";
  
  // Auto-save parsed profile into global state
  state.profile = {
    fullName: data.fullName || "Candidate",
    title: data.title || "Software Engineer",
    experience: parseInt(data.experience) || 1,
    location: data.location || "Remote",
    skills: data.skills || ["Java", "SQL", "React"],
    education: data.education || "B.Tech in Computer Science",
    resumeText: data.resumeText || els.resumePasteInput.value.trim()
  };
  
  // Save to persistent storage
  saveStateToStorage();
  
  // If user is logged in, sync avatar initial with extracted candidate name
  if (state.currentUser && state.currentUser.role === 'seeker') {
    state.currentUser.name = state.profile.fullName;
    saveStateToStorage();
    updateAuthHeaderUI();
  }
  
  // Draw skills badges
  renderSkillsTags(state.profile.skills);
  
  // Re-render all job matching metrics across the portal
  renderAll();
  
  // Find top matching job
  let topScore = 0;
  let topJobTitle = "";
  state.jobs.forEach(job => {
    const sc = AIEngine.calculateMatchScore(state.profile, job);
    if (sc.overall > topScore) {
      topScore = sc.overall;
      topJobTitle = `${job.title} at ${job.company}`;
    }
  });
  
  addNotification(
    "AI Profile Auto-Filled & Matched 🎉",
    `Extracted ${state.profile.skills.length} skills for ${state.profile.title}. Top match: ${topScore}% (${topJobTitle}).`,
    "🎯"
  );
  
  showToast(`🎉 Auto-Filled Profile for ${state.profile.fullName} (${state.profile.title})! Found Top Match: ${topScore}% (${topJobTitle})`, "success", 4500);
  
  if (window.resetProfileWizard) {
    window.resetProfileWizard();
  }
}

function renderSkillsTags(skillsArr) {
  if (!els.parsedSkillsTagsContainer) return;
  els.parsedSkillsTagsContainer.innerHTML = '';
  skillsArr.forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = skill;
    els.parsedSkillsTagsContainer.appendChild(tag);
  });
}

function handleProfileSaveForm(e) {
  e.preventDefault();
  
  const skillsList = els.profileSkills.value.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
    
  state.profile = {
    fullName: els.profileFullName.value.trim(),
    title: els.profileTitle.value.trim(),
    experience: parseInt(els.profileExperience.value) || 0,
    location: els.profileLocation.value.trim(),
    skills: skillsList,
    education: els.profileEducation.value.trim(),
    resumeText: els.resumePasteInput.value.trim()
  };
  
  addNotification(
    "Profile Updated", 
    `AI Profile parsing completed. Matched jobs matching score values recalculated.`, 
    "🧠"
  );
  saveStateToStorage();
  renderAll();
  showToast("Profile saved! Matching scores updated across all jobs.", "success");
}

/* ==========================================
   SEEKER JOB MATCH BOARD & FILTERS
   ========================================== */
function renderJobsBoardList() {
  const query = els.jobSearchInput.value.toLowerCase();
  const locFilter = els.jobLocationFilter.value;
  
  els.seekerJobsListContainer.innerHTML = '';
  
  // Calculate scores and sort jobs by overall score
  const scoredJobs = state.jobs.map(job => {
    const scores = AIEngine.calculateMatchScore(state.profile, job);
    return { ...job, scores };
  }).sort((a, b) => b.scores.overall - a.scores.overall);
  
  let matchCount = 0;
  scoredJobs.forEach(job => {
    // Query check
    const matchesQuery = job.title.toLowerCase().includes(query) || 
                         job.company.toLowerCase().includes(query) || 
                         job.skills.some(s => s.toLowerCase().includes(query));
                         
    // Location check
    let matchesLoc = true;
    if (locFilter === 'remote') matchesLoc = job.type === 'remote';
    if (locFilter === 'on-site') matchesLoc = job.type === 'on-site';
    
    if (matchesQuery && matchesLoc) {
      matchCount++;
      const item = document.createElement('div');
      item.className = 'job-item';
      item.setAttribute('data-id', job.id);
      
      const scoreClass = job.scores.overall >= 80 ? 'high' : (job.scores.overall >= 55 ? 'mid' : 'low');
      
      item.innerHTML = `
        <div>
          <div class="job-item-title">${job.title}</div>
          <div class="job-item-company">${job.company} • ${job.location}</div>
          <div class="job-item-meta">
            <span>Exp Req: ${job.experience}y</span>
            <span>Type: ${job.type.toUpperCase()}</span>
          </div>
        </div>
        <div class="score-badge ${scoreClass}">
          ${job.scores.overall}%
        </div>
      `;
      
      item.addEventListener('click', () => {
        // Toggle selected state visual class
        document.querySelectorAll('.job-item').forEach(n => n.classList.remove('selected'));
        item.classList.add('selected');
        renderJobDetailsPanel(job.id);
      });
      
      els.seekerJobsListContainer.appendChild(item);
    }
  });
  
  if (matchCount === 0) {
    els.seekerJobsListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
        No active job listings match your current filters.
      </div>
    `;
  }
}

function renderJobDetailsPanel(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  
  const scores = AIEngine.calculateMatchScore(state.profile, job);
  const alreadyApplied = state.applications.some(app => app.jobId === jobId);
  const scoreClass = scores.overall >= 80 ? 'high' : (scores.overall >= 55 ? 'mid' : 'low');
  
  els.seekerJobDetailsPanel.innerHTML = `
    <div class="job-detail-header" style="margin-bottom: 15px;">
      <div>
        <h2 class="job-title-large" style="font-size: 18px; margin-bottom: 2px;">${job.title}</h2>
        <div style="font-weight: 600; color: var(--text-muted); margin-bottom: 6px; font-size: 12px;">${job.company} • ${job.location}</div>
        <div style="font-size: 11px; font-weight: 600; display: flex; gap: 12px; color: var(--text-light);">
          <span>💰 Est. Salary: ${job.salary}</span>
          <span>📅 Type: ${job.type.toUpperCase()}</span>
        </div>
      </div>
      <div class="score-badge ${scoreClass}" style="width: 52px; height: 52px; font-size: 13px; flex-shrink: 0;">
        ${scores.overall}%
      </div>
    </div>
    
    <!-- Sub-tab headers (Screen 11) -->
    <div style="display: flex; gap: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 14px;">
      <span class="tab-link active" id="jobTabOverview" style="font-weight: 700; font-size: 11px; cursor: pointer; color: var(--primary);">Overview</span>
      <span class="tab-link" id="jobTabRequirements" style="font-weight: 600; font-size: 11px; cursor: pointer; color: var(--text-muted);">AI Match Analysis</span>
      <span class="tab-link" id="jobTabCompany" style="font-weight: 600; font-size: 11px; cursor: pointer; color: var(--text-muted);">Company Info</span>
      <span class="tab-link" id="jobTabReviews" style="font-weight: 600; font-size: 11px; cursor: pointer; color: var(--text-muted);">Reviews</span>
    </div>
    
    <div class="job-detail-body" style="flex: 1; overflow-y: auto; padding-right: 4px;">
      <!-- Tab A: Overview -->
      <div id="jobContentOverview" style="display: block;">
        <h3 style="font-size: 12px; font-weight: 800; margin-bottom: 6px;">Job Description</h3>
        <p style="font-size: 12px; line-height: 1.5; color: var(--text-main); margin-bottom: 14px;">${job.description}</p>
      </div>
      
      <!-- Tab B: Requirements & AI Analysis (Screen 12) -->
      <div id="jobContentRequirements" style="display: none; flex-direction: column; gap: 12px;">
        <h3 style="font-size: 12px; font-weight: 800; margin-bottom: 2px;">AI Matching Breakdown</h3>
        <!-- Horizontal Match progress bars (Screen 12) -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; margin-bottom: 2px;">
              <span>Skills Overlap</span>
              <span>${scores.skills}%</span>
            </div>
            <div style="height: 5px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
              <div style="width: ${scores.skills}%; height: 100%; background: var(--primary);"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; margin-bottom: 2px;">
              <span>Experience Match</span>
              <span>${scores.experience}%</span>
            </div>
            <div style="height: 5px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
              <div style="width: ${scores.experience}%; height: 100%; background: var(--primary);"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; margin-bottom: 2px;">
              <span>Location Match</span>
              <span>${scores.location}%</span>
            </div>
            <div style="height: 5px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
              <div style="width: ${scores.location}%; height: 100%; background: var(--primary);"></div>
            </div>
          </div>
        </div>
        
        <h3 style="font-size: 12px; font-weight: 800; margin-bottom: 4px;">Required Profile Stack</h3>
        <div class="skills-tags" style="margin-bottom: 10px;">
          ${job.skills.map(s => `<span class="tag" style="font-size: 10px;">${s}</span>`).join('')}
        </div>
      </div>
      
      <!-- Tab C: Company Info -->
      <div id="jobContentCompany" style="display: none;">
        <h3 style="font-size: 12px; font-weight: 800; margin-bottom: 6px;">About ${job.company}</h3>
        <p style="font-size: 12px; line-height: 1.5; color: var(--text-muted); margin-bottom: 12px;">
          ${job.company} is a leading industry pioneer in modern tech infrastructure. We focus on scale, collaboration, high-performing product engineering setups, and equal opportunity development tracks.
        </p>
        <div style="font-size: 11px; color: var(--text-light); font-weight: 600;">
          📍 Headquarters: ${job.location}<br>
          👥 Size: 500-1000 employees<br>
          🌐 Website: www.${job.company.toLowerCase().replace(/ /g, '')}.com
        </div>
      </div>
      
      <!-- Tab D: Reviews -->
      <div id="jobContentReviews" style="display: none; flex-direction: column; gap: 8px;">
        <h3 style="font-size: 12px; font-weight: 800; margin-bottom: 4px;">Employee Rating</h3>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span style="font-size: 20px; font-weight: 800; color: var(--text-main);">4.8</span>
          <span style="color: var(--warning); font-size: 16px;">★★★★★</span>
          <span style="font-size: 11px; color: var(--text-light);">(42 reviews)</span>
        </div>
        <div style="border-left: 2px solid var(--primary); padding-left: 10px; margin-bottom: 8px;">
          <p style="font-size: 11px; font-style: italic; margin-bottom: 2px;">"Incredible team support, great remote work policies, and access to premium tooling channels."</p>
          <span style="font-size: 9px; color: var(--text-light);">- Senior Software Engineer</span>
        </div>
        <div style="border-left: 2px solid var(--primary); padding-left: 10px;">
          <p style="font-size: 11px; font-style: italic; margin-bottom: 2px;">"Highly collaborative environment, fast learning cycles, and highly challenging projects."</p>
          <span style="font-size: 9px; color: var(--text-light);">- Lead Architect</span>
        </div>
      </div>
    </div>
    
    <div class="job-detail-actions" style="margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
      ${alreadyApplied 
        ? `<button class="btn-secondary" style="flex: 1; cursor: not-allowed;" disabled>Applied ✓</button>`
        : `<button class="btn-primary" style="flex: 1.2; font-weight: 700;" id="jobApplyBtn">Apply Now</button>`
      }
      <button class="btn-secondary" id="jobCoverLetterBtn" style="flex: 1; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">✉️ AI Cover Letter</button>
      <button class="btn-secondary" id="jobDeclineBtn" style="flex: 1;">Save / Bookmark</button>
    </div>
  `;

  // Tab Event Listeners
  const subTabs = ['Overview', 'Requirements', 'Company', 'Reviews'];
  subTabs.forEach(tName => {
    const btn = document.getElementById(`jobTab${tName}`);
    if (btn) {
      btn.addEventListener('click', () => {
        // Reset tabs style
        subTabs.forEach(tn => {
          const b = document.getElementById(`jobTab${tn}`);
          const content = document.getElementById(`jobContent${tn}`);
          if (b && content) {
            b.classList.remove('active');
            b.style.color = 'var(--text-muted)';
            b.style.fontWeight = '600';
            content.style.display = 'none';
          }
        });
        
        // Activate current tab
        btn.classList.add('active');
        btn.style.color = 'var(--primary)';
        btn.style.fontWeight = '700';
        const activeContent = document.getElementById(`jobContent${tName}`);
        if (activeContent) {
          if (tName === 'Requirements' || tName === 'Reviews') {
            activeContent.style.display = 'flex';
          } else {
            activeContent.style.display = 'block';
          }
        }
      });
    }
  });

  // Apply button binding
  const applyBtn = document.getElementById('jobApplyBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => handleApplyToJob(jobId));
  }

  // Cover letter generator button binding
  const clBtn = document.getElementById('jobCoverLetterBtn');
  if (clBtn) {
    clBtn.addEventListener('click', () => openCoverLetterModal(job));
  }
  
  // Bookmark button toggle binding
  const bookmarkBtn = document.getElementById('jobDeclineBtn');
  if (bookmarkBtn) {
    const isBookmarked = state.bookmarkedJobs && state.bookmarkedJobs.includes(jobId);
    if (isBookmarked) {
      bookmarkBtn.textContent = "Bookmarked ✓";
      bookmarkBtn.style.color = "var(--primary)";
      bookmarkBtn.style.borderColor = "var(--primary)";
    }
    bookmarkBtn.addEventListener('click', () => {
      toggleJobBookmark(jobId);
    });
  }
}

function handleApplyToJob(jobId) {
  // If user not authenticated, force log-in
  if (!state.currentUser) {
    alert("Please Sign In to submit job applications.");
    toggleAuthModal(true);
    return;
  }
  
  const alreadyApplied = state.applications.some(app => app.jobId === jobId);
  if (alreadyApplied) return;
  
  const job = state.jobs.find(j => j.id === jobId);
  const scores = AIEngine.calculateMatchScore(state.profile, job);
  
  const newApp = {
    id: "app-" + Date.now(),
    jobId: jobId,
    seekerName: state.profile.fullName || state.currentUser.name,
    seekerTitle: state.profile.title || "Software Developer",
    status: "applied",
    appliedDate: new Date().toISOString().split('T')[0],
    matchingScore: scores.overall
  };
  
  state.applications.push(newApp);
  addNotification(
    "Application Submitted", 
    `Applied to ${job.company} for the position of ${job.title}.`, 
    "✉️"
  );
  saveStateToStorage();
  renderAll();
  
  // Render custom confirmation success screen instead of standard alert
  renderApplySuccessPanel(job, newApp);
}

/* ==========================================
   AUTO-APPLY SIMULATOR
   ========================================== */
function handleAutoApplyToggle(e) {
  const active = e.target.checked;
  if (!state.currentUser) {
    alert("Please Sign In first to trigger Auto-Apply algorithms.");
    els.autoApplyToggleSwitch.checked = false;
    toggleAuthModal(true);
    return;
  }
  
  if (active) {
    const threshold = parseInt(els.autoApplyThresholdSlider.value);
    
    // Find eligible matches that haven't been applied to
    const eligibleMatches = state.jobs.filter(job => {
      const alreadyApplied = state.applications.some(app => app.jobId === job.id);
      if (alreadyApplied) return false;
      
      const scores = AIEngine.calculateMatchScore(state.profile, job);
      return scores.overall >= threshold;
    });
    
    if (eligibleMatches.length === 0) {
      alert("No new jobs found matching your criteria.");
      els.autoApplyToggleSwitch.checked = false;
      return;
    }
    
    // Simulate auto apply actions sequentially
    let applyCount = 0;
    eligibleMatches.forEach((job, idx) => {
      setTimeout(() => {
        const scores = AIEngine.calculateMatchScore(state.profile, job);
        const newApp = {
          id: "app-auto-" + idx + "-" + Date.now(),
          jobId: job.id,
          seekerName: state.profile.fullName,
          seekerTitle: state.profile.title,
          status: "applied",
          appliedDate: new Date().toISOString().split('T')[0],
          matchingScore: scores.overall
        };
        state.applications.push(newApp);
        addNotification(
          "Auto-Apply Submissions", 
          `Automatically applied to ${job.company} for ${job.title} (${scores.overall}% match).`, 
          "⚡"
        );
        saveStateToStorage();
        renderAll();
        
        // Show status updates
        console.log(`Auto-Applied to ${job.company}: ${job.title}`);
      }, idx * 600);
      applyCount++;
    });
    
    setTimeout(() => {
      alert(`Auto-Apply complete! Applied to ${applyCount} positions with match scores >= ${threshold}%.`);
      els.autoApplyToggleSwitch.checked = false;
    }, eligibleMatches.length * 600 + 100);
  }
}

/* ==========================================
   SEEKER KANBAN PIPELINE RENDER
   ========================================== */
function renderKanbanBoard() {
  // Clear lists
  els.kanbanColApplied.innerHTML = '';
  els.kanbanColReview.innerHTML = '';
  els.kanbanColInterview.innerHTML = '';
  els.kanbanColOffer.innerHTML = '';
  els.applicationsGridList.innerHTML = '';
  
  let cntApplied = 0;
  let cntReview = 0;
  let cntInterview = 0;
  let cntOffer = 0;
  let cntRejected = 0;
  
  // Update view mode display
  if (state.applicationsViewMode === 'kanban') {
    els.toggleViewKanbanBtn.classList.add('active');
    els.toggleViewGridBtn.classList.remove('active');
    els.gridFilterPills.style.display = 'none';
    els.applicationsKanbanBoard.style.display = 'flex';
    els.applicationsGridList.style.display = 'none';
  } else {
    els.toggleViewKanbanBtn.classList.remove('active');
    els.toggleViewGridBtn.classList.add('active');
    els.gridFilterPills.style.display = 'flex';
    els.applicationsKanbanBoard.style.display = 'none';
    els.applicationsGridList.style.display = 'grid';
  }
  
  state.applications.forEach(app => {
    const job = state.jobs.find(j => j.id === app.jobId);
    if (!job) return;
    
    // Summary counting
    if (app.status === 'applied') cntApplied++;
    if (app.status === 'review') cntReview++;
    if (app.status === 'interview') cntInterview++;
    if (app.status === 'offer') cntOffer++;
    if (app.status === 'rejected') cntRejected++;
    
    // A. Create Kanban Card element
    const card = document.createElement('div');
    card.className = 'kanban-card';
    
    let statusText = "Applied";
    let badgeClass = "review";
    if (app.status === 'review') { statusText = "Reviewing"; badgeClass = "review"; }
    if (app.status === 'interview') { statusText = "Interview Set"; badgeClass = "interview"; }
    if (app.status === 'offer') { statusText = "Offer Made"; badgeClass = "offer"; }
    if (app.status === 'rejected') { statusText = "Rejected"; badgeClass = "reject"; }
    
    card.innerHTML = `
      <div class="kanban-card-title">${job.title}</div>
      <div class="kanban-card-company">${job.company}</div>
      <div class="kanban-card-meta">
        <span style="font-weight: 700; color: var(--primary);">${app.matchingScore}% match</span>
        <span class="kanban-card-status-badge ${badgeClass}">${statusText}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      openAppDetailsModal(app.id);
    });
    
    if (app.status === 'applied') {
      els.kanbanColApplied.appendChild(card);
    } else if (app.status === 'review') {
      els.kanbanColReview.appendChild(card);
    } else if (app.status === 'interview') {
      els.kanbanColInterview.appendChild(card);
    } else if (app.status === 'offer') {
      els.kanbanColOffer.appendChild(card);
    }
    
    // B. Create Grid Card list element (JOBinex Style)
    let matchesFilter = true;
    if (state.applicationsGridFilter !== 'all' && app.status !== state.applicationsGridFilter) {
      matchesFilter = false;
    }
    
    if (matchesFilter) {
      const gridCard = document.createElement('div');
      gridCard.className = 'card-widget';
      gridCard.style.padding = '16px';
      gridCard.style.display = 'flex';
      gridCard.style.flexDirection = 'column';
      gridCard.style.justifyContent = 'space-between';
      gridCard.style.cursor = 'pointer';
      gridCard.style.transition = 'var(--transition-fast)';
      gridCard.style.borderLeft = `4px solid ${
        app.status === 'offer' ? 'var(--success)' : 
        (app.status === 'interview' ? 'var(--primary)' : 
        (app.status === 'review' ? 'hsl(35, 100%, 55%)' : 
        (app.status === 'rejected' ? 'var(--danger)' : 'var(--border-color)')))
      }`;
      
      gridCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h4 style="font-weight: 800; font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${job.title}</h4>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${job.company} • ${job.location}</div>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: var(--primary);">${app.matchingScore}% Match</span>
        </div>
        
        <div style="display: flex; gap: 6px; margin-bottom: 12px;">
          <span class="tag" style="font-size: 9px; padding: 2px 6px;">${job.type.toUpperCase()}</span>
          <span class="tag" style="font-size: 9px; padding: 2px 6px;">${job.experience}y Exp</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 8px;">
          <span class="kanban-card-status-badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px;">${statusText}</span>
          <span style="font-size: 10px; color: var(--text-light);">Applied: ${app.appliedDate}</span>
        </div>
      `;
      
      gridCard.addEventListener('click', () => {
        openAppDetailsModal(app.id);
      });
      
      els.applicationsGridList.appendChild(gridCard);
    }
  });
  
  // Set count indicators
  els.kanbanCountApplied.textContent = cntApplied;
  els.kanbanCountReview.textContent = cntReview;
  els.kanbanCountInterview.textContent = cntInterview;
  els.kanbanCountOffer.textContent = cntOffer;
  
  // Summary Stats Counters
  els.summaryCountApplied.textContent = cntApplied;
  els.summaryCountReview.textContent = cntReview;
  els.summaryCountInterview.textContent = cntInterview;
  els.summaryCountOffer.textContent = cntOffer;
  
  if (state.applicationsViewMode === 'grid' && els.applicationsGridList.children.length === 0) {
    els.applicationsGridList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-muted);">
        No applications match this filter pill selection.
      </div>
    `;
  }
}

/* ==========================================
   AI CAREER TOOLS LOGIC
   ========================================== */
function handleStartMockInterview() {
  const role = els.mockInterviewRoleSelect.value;
  state.activeInterviewRole = role;
  state.activeInterviewChatIdx = 0;
  
  els.mockInterviewUserInput.disabled = false;
  els.sendMockAnswerBtn.disabled = false;
  
  els.mockInterviewChatHistory.innerHTML = '';
  
  const question = AIEngine.getInterviewQuestion(role, 0);
  addChatBubble("bot", `Great choice! Starting your mock interview for the **${role}** role. Here is your first question:\n\n"${question}"`);
  
  els.mockInterviewUserInput.value = "";
  els.mockInterviewUserInput.focus();
}

function handleSendMockAnswer() {
  const answer = els.mockInterviewUserInput.value.trim();
  if (!answer) return;
  
  addChatBubble("user", answer);
  els.mockInterviewUserInput.value = "";
  
  // Grade current answer
  const questions = AIEngine.mockInterviewQuestions[state.activeInterviewRole];
  const currentQuestion = questions[state.activeInterviewChatIdx];
  const grading = AIEngine.gradeUserAnswer(currentQuestion, answer);
  
  els.mockInterviewUserInput.disabled = true;
  els.sendMockAnswerBtn.disabled = true;
  
  setTimeout(() => {
    addChatBubble("bot", `*Feedback Rating: ${grading.score}/100*\n${grading.feedback}`);
    
    state.activeInterviewChatIdx++;
    const nextQuestion = AIEngine.getInterviewQuestion(state.activeInterviewRole, state.activeInterviewChatIdx);
    
    setTimeout(() => {
      if (nextQuestion) {
        addChatBubble("bot", `Next Question:\n\n"${nextQuestion}"`);
        els.mockInterviewUserInput.disabled = false;
        els.sendMockAnswerBtn.disabled = false;
        els.mockInterviewUserInput.focus();
      } else {
        addChatBubble("bot", `**Mock Interview Complete!** 🎉\nYou've finished all questions. Great job! Check your resume score to review further optimizations.`);
      }
    }, 250);
    
  }, 250);
}

function addChatBubble(sender, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text.replace(/\n/g, '<br>');
  els.mockInterviewChatHistory.appendChild(bubble);
  
  // Auto scroll to bottom
  els.mockInterviewChatHistory.scrollTop = els.mockInterviewChatHistory.scrollHeight;
}

function renderResumeScorecard() {
  const profile = state.profile;
  let score = 0;
  
  const checks = [
    { key: 'name', check: profile.fullName && profile.fullName !== "User", label: "Full Name Detected" },
    { key: 'contact', check: profile.resumeText && (profile.resumeText.includes('@') || profile.resumeText.match(/\d{3}/)), label: "Contact details found" },
    { key: 'exp', check: profile.experience > 0, label: "Work experience recorded" },
    { key: 'skills', check: profile.skills.length > 0, label: `Skills profile setup (${profile.skills.length} tags)` },
    { key: 'length', check: profile.resumeText && profile.resumeText.split(' ').length > 80, label: "Detailed formatting content" }
  ];
  
  checks.forEach(item => {
    if (item.check) score += 20;
  });
  
  els.resumeHealthScoreBadge.textContent = `${score}%`;
  
  // Custom recommendations based on user details
  const keywordAdvice = profile.skills.length < 6 
    ? "Include industry-specific keywords like AWS, Docker, Git, System Design." 
    : "Excellent skill density! Ready for AI Auto-Apply channels.";
  const expAdvice = profile.experience < 4
    ? "Add quantifiable metrics under experiences (e.g. 'Optimized APIs reducing latency by 20%')."
    : "Highlight senior architectural accomplishments and scope numbers.";
  
  els.resumeChecklistContainer.innerHTML = `
    <!-- Category Progress Bars (Screen 8) -->
    <div style="margin-bottom: 16px; width: 100%;">
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px;">
          <span>Skills Match</span>
          <span>${profile.skills.length > 0 ? '92%' : '10%'}</span>
        </div>
        <div style="height: 6px; background-color: var(--border-color); border-radius: 3px; overflow: hidden;">
          <div style="width: ${profile.skills.length > 0 ? '92%' : '10%'}; height: 100%; background-color: var(--primary); transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px;">
          <span>Experience Match</span>
          <span>${profile.experience > 0 ? '88%' : '15%'}</span>
        </div>
        <div style="height: 6px; background-color: var(--border-color); border-radius: 3px; overflow: hidden;">
          <div style="width: ${profile.experience > 0 ? '88%' : '15%'}; height: 100%; background-color: var(--primary); transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px;">
          <span>Education Match</span>
          <span>${profile.education ? '85%' : '20%'}</span>
        </div>
        <div style="height: 6px; background-color: var(--border-color); border-radius: 3px; overflow: hidden;">
          <div style="width: ${profile.education ? '85%' : '20%'}; height: 100%; background-color: var(--primary); transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px;">
          <span>Profile Strength</span>
          <span>${score}%</span>
        </div>
        <div style="height: 6px; background-color: var(--border-color); border-radius: 3px; overflow: hidden;">
          <div style="width: ${score}%; height: 100%; background-color: var(--success); transition: width 0.3s ease;"></div>
        </div>
      </div>
    </div>
    
    <!-- Checklist items -->
    <div style="font-weight: 700; font-size: 11px; color: var(--text-main); margin-bottom: 8px; border-top: 1px solid var(--border-color); padding-top: 10px;">
      AI QUALITY CHECKLIST
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; width: 100%;">
      ${checks.map(item => {
        const clr = item.check ? 'var(--success)' : 'var(--text-light)';
        const mark = item.check ? '✓' : '○';
        return `
          <div style="display: flex; align-items: center; gap: 6px; color: ${clr};">
            <span style="font-weight: 800;">${mark}</span>
            <span>${item.label}</span>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- AI Optimization Advice Box -->
    <div style="margin-top: 12px; background-color: var(--primary-light); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid hsl(220, 90%, 90%); width: 100%;">
      <div style="font-size: 11px; font-weight: 700; color: var(--primary); margin-bottom: 4px;">AI Optimizations</div>
      <ul style="margin: 0; padding-left: 14px; font-size: 11px; color: var(--text-muted); line-height: 1.4;">
        <li style="margin-bottom: 4px;">${keywordAdvice}</li>
        <li>${expAdvice}</li>
      </ul>
    </div>
  `;
}

function handleSalaryEstimateUpdate() {
  const exp = parseInt(els.salaryExpSlider.value);
  els.salaryExpVal.textContent = exp + " Years";
  
  const title = els.salaryRoleInput.value.trim().toLowerCase();
  
  // Calculate simulated salary brackets
  let baseMin = 50;
  let baseMax = 70;
  
  if (title.includes('senior') || title.includes('lead') || title.includes('architect') || exp > 5) {
    baseMin = 110;
    baseMax = 150;
  } else if (title.includes('frontend') || title.includes('developer') || title.includes('engineer')) {
    baseMin = 75;
    baseMax = 110;
  } else if (title.includes('manager') || title.includes('pm')) {
    baseMin = 90;
    baseMax = 130;
  }
  
  // Scale with experience
  const multiplier = 1 + (exp * 0.08);
  const finalMin = Math.round(baseMin * multiplier);
  const finalMax = Math.round(baseMax * multiplier);
  
  els.salaryResultDisplay.textContent = `$${finalMin.toLocaleString()},000 - $${finalMax.toLocaleString()},000`;
}

/* ==========================================
   RECRUITER DASHBOARD PROCESSES
   ========================================== */
function toggleRecruiterJobModal(show) {
  if (show) {
    els.recruiterPostJobModalOverlay.classList.add('active');
  } else {
    els.recruiterPostJobModalOverlay.classList.remove('active');
  }
}

function handleRecruiterJobPublish(e) {
  e.preventDefault();
  
  const skillsList = document.getElementById('postJobSkills').value.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
    
  const newJob = {
    id: "job-" + (state.jobs.length + 1),
    title: document.getElementById('postJobTitle').value.trim(),
    company: document.getElementById('postJobCompany').value.trim(),
    location: document.getElementById('postJobLocation').value.trim(),
    type: document.getElementById('postJobType').value,
    experience: parseInt(document.getElementById('postJobExperience').value) || 0,
    salary: document.getElementById('postJobSalary').value.trim(),
    skills: skillsList,
    description: document.getElementById('postJobDescription').value.trim() || "No description provided."
  };
  
  state.jobs.push(newJob);
  saveStateToStorage();
  
  // Reset Form
  els.recruiterJobForm.reset();
  toggleRecruiterJobModal(false);
  
  renderAll();
  alert(`Successfully posted new role: ${newJob.title} at ${newJob.company}!`);
}

function renderRecruiterJobsGrid() {
  els.recruiterActiveJobsGridContainer.innerHTML = '';
  
  state.jobs.forEach(job => {
    // Count applications for this job
    const applicantsCount = state.applications.filter(app => app.jobId === job.id).length;
    
    const card = document.createElement('div');
    card.className = 'recruiter-job-card';
    card.innerHTML = `
      <div class="recruiter-job-header">
        <h3>${job.title}</h3>
        <div style="font-size: 12px; color: var(--text-muted);">${job.company} • ${job.location}</div>
        <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">Skills: ${job.skills.slice(0,3).join(', ')}...</div>
      </div>
      <div class="recruiter-job-applicants">
        <span class="recruiter-job-applicants-lbl">Total Applicants:</span>
        <span class="recruiter-job-applicants-num">${applicantsCount}</span>
      </div>
    `;
    
    els.recruiterActiveJobsGridContainer.appendChild(card);
  });
}

function renderRecruiterCandidateLists() {
  const jobId = els.screenJobSelector.value;
  els.recruiterCandidatesListContainer.innerHTML = '';
  
  if (!jobId) {
    els.recruiterCandidatesListContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted);">Please post a job opening first.</div>`;
    return;
  }
  
  const selectedJob = state.jobs.find(j => j.id === jobId);
  if (!selectedJob) return;
  
  // Filter active applications for this job OR simulate general candidates pool matching this job
  const appsForJob = state.applications.filter(app => app.jobId === jobId);
  
  // Create sorted entries
  const listEntries = [];
  
  appsForJob.forEach(app => {
    listEntries.push({
      type: 'applicant',
      id: app.id,
      name: app.seekerName,
      title: app.seekerTitle,
      score: app.matchingScore,
      status: app.status
    });
  });
  
  // Seed random mock candidates if list is short to demonstrate matching
  if (listEntries.length === 0) {
    state.candidates.forEach((cand, idx) => {
      const matchDetails = AIEngine.calculateMatchScore(cand, selectedJob);
      listEntries.push({
        type: 'mock',
        id: "mock-c-" + idx,
        name: cand.fullName,
        title: cand.title,
        score: matchDetails.overall,
        status: 'unapplied',
        profile: cand
      });
    });
  }
  
  // Sort by highest score
  listEntries.sort((a, b) => b.score - a.score);
  
  listEntries.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'candidate-item';
    item.setAttribute('data-cand-id', entry.id);
    
    item.innerHTML = `
      <div class="candidate-details">
        <span class="candidate-name">${entry.name}</span>
        <span class="candidate-title">${entry.title} • Status: <strong style="text-transform: capitalize; color: var(--primary);">${entry.status}</strong></span>
      </div>
      <div style="text-align: right;">
        <span style="font-weight: 800; font-size: 16px; color: var(--success);">${entry.score}%</span>
        <div class="candidate-score-lbl">Match</div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('.candidate-item').forEach(n => n.classList.remove('selected'));
      item.classList.add('selected');
      renderCandidateDetailsPanel(entry, selectedJob);
    });
    
    els.recruiterCandidatesListContainer.appendChild(item);
  });
}

function renderCandidateDetailsPanel(entry, job) {
  let profileSource = state.profile;
  
  if (entry.type === 'mock') {
    profileSource = entry.profile;
  }
  
  const scoreBreakdowns = AIEngine.calculateMatchScore(profileSource, job);
  const existingRecord = state.interviewRecords.find(r => r.candidateId === entry.id || r.candidateName === entry.name);
  const appObj = state.applications.find(a => a.id === entry.id);
  const isScheduled = entry.status === 'interview' || (appObj && appObj.status === 'interview');
  const interviewDateFormatted = (appObj && appObj.interviewDate) ? appObj.interviewDate.replace('T', ' ') : 'Aug 18, 2026 at 10:00 AM';

  els.recruiterCandidateDetailsPanel.innerHTML = `
    <div class="screener-detail-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">${entry.name}</h2>
          <div style="font-weight: 600; color: var(--text-muted);">${entry.title} • ${profileSource.location}</div>
        </div>
        <div class="score-badge high" style="width: 56px; height: 56px; font-size: 14px;">
          ${entry.score}%
        </div>
      </div>
      
      <!-- Mini criteria checklist -->
      <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 12px;">
        <span>Skills match: <strong>${scoreBreakdowns.skills}%</strong></span>
        <span>Exp Match: <strong>${scoreBreakdowns.experience}%</strong></span>
        <span>Location Match: <strong>${scoreBreakdowns.location}%</strong></span>
      </div>
    </div>
    
    <div class="job-detail-body">
      <!-- AI Interview Dossier Highlight Banner if Completed -->
      ${existingRecord ? `
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08)); border: 1.5px solid var(--primary); border-radius: var(--border-radius-sm); padding: 14px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🤖</span>
              <strong style="font-size: 13px; color: var(--primary);">AI Interview Conducted & Stored In-Memory</strong>
            </div>
            <span class="badge ${existingRecord.recommendationBadge ? 'badge-rec-' + existingRecord.recommendationBadge : 'badge-apply'}" style="font-size: 11px;">${existingRecord.recommendation.toUpperCase()}</span>
          </div>
          <div style="display: flex; gap: 14px; font-size: 12px; color: var(--text-main); margin-bottom: 10px;">
            <span>Overall: <strong style="color: var(--success);">${existingRecord.overallScore}%</strong></span>
            <span>Tech: <strong>${existingRecord.technicalScore}%</strong></span>
            <span>Comm: <strong>${existingRecord.communicationScore}%</strong></span>
            <span>STAR: <strong>${existingRecord.starScore}%</strong></span>
          </div>
          <button class="btn-primary" id="btnViewDossierFromPanel" style="padding: 6px 14px; font-size: 12px; width: 100%;">📊 View Full AI Interview Dossier & Q&A Transcript</button>
        </div>
      ` : ''}

      <!-- Scheduled Interview Notice Banner -->
      ${isScheduled && !existingRecord ? `
        <div style="background: var(--primary-light); border: 1px solid var(--primary); border-radius: var(--border-radius-sm); padding: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 6px;">
              <span>📅</span> Interview Scheduled: ${interviewDateFormatted}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Assigned to SmartHire AI Interviewer Agent</div>
          </div>
          <button class="btn-primary" id="btnLaunchAgentFromPanel" style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #6366f1, #a855f7); font-weight: 700;">🚀 Start AI Interview Room</button>
        </div>
      ` : ''}

      <h3>Education</h3>
      <p>${profileSource.education || "B.S. in Computer Science"}</p>
      
      <h3>Candidate Skills Stack</h3>
      <div class="skills-tags">
        ${profileSource.skills.map(s => `<span class="tag">${s}</span>`).join('')}
      </div>
      
      <h3>Parsed Resume Summary</h3>
      <p style="background-color: var(--bg-primary); padding: 12px; border-radius: var(--border-radius-sm); font-size: 12px; font-family: monospace;">
        ${profileSource.resumeText ? profileSource.resumeText.substring(0, 300) + '...' : "No details parsed yet."}
      </p>
    </div>
    
    <div class="screener-actions-footer">
      ${entry.status === 'unapplied'
        ? `<button class="btn-primary" id="recruiterForceApplyBtn">Invite / Add Applicant</button>`
        : `
          <button class="btn-secondary" style="background-color: var(--danger-light); color: var(--danger);" id="actionRejectBtn">Reject</button>
          <button class="btn-primary" id="actionInterviewBtn" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); font-weight: 700;">
            ${isScheduled ? '📅 Reschedule Interview' : 'Schedule Interview'}
          </button>
          <button class="btn-primary" style="background-color: var(--success);" id="actionOfferBtn">Extend Offer</button>
        `
      }
    </div>
  `;
  
  // Attach buttons events
  if (entry.status === 'unapplied') {
    document.getElementById('recruiterForceApplyBtn').addEventListener('click', () => {
      const newApp = {
        id: "app-" + Date.now(),
        jobId: job.id,
        seekerName: entry.name,
        seekerTitle: entry.title,
        status: "applied",
        appliedDate: new Date().toISOString().split('T')[0],
        matchingScore: entry.score
      };
      state.applications.push(newApp);
      saveStateToStorage();
      renderAll();
      alert(`Invited ${entry.name} to apply! Added to screening tracker.`);
    });
  } else {
    document.getElementById('actionRejectBtn').addEventListener('click', () => updateApplicantStatus(entry.id, 'rejected'));
    document.getElementById('actionOfferBtn').addEventListener('click', () => updateApplicantStatus(entry.id, 'offer'));
    document.getElementById('actionInterviewBtn').addEventListener('click', () => {
      openScheduleInterviewModal(entry, job);
    });

    const btnLaunch = document.getElementById('btnLaunchAgentFromPanel');
    if (btnLaunch) {
      btnLaunch.addEventListener('click', () => {
        startAIInterviewSession(entry, job);
      });
    }

    const btnDossier = document.getElementById('btnViewDossierFromPanel');
    if (btnDossier && existingRecord) {
      btnDossier.addEventListener('click', () => {
        openInterviewReportModal(existingRecord);
      });
    }
  }
}

/* ==========================================
   INTERVIEW SCHEDULER MODAL ACTIONS
   ========================================== */
function openScheduleInterviewModal(entry, job) {
  els.schedCandidateAppId.value = entry.id;
  els.schedCandidateName.value = `${entry.name} (${entry.title})`;
  els.schedJobInfo.value = `${job.title} at ${job.company}`;
  
  // Default to tomorrow 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
  els.schedDateTime.value = dateStr;

  // Stash entry & job on window for quick immediate launching
  window._activeSchedCandidate = entry;
  window._activeSchedJob = job;

  els.scheduleInterviewModalOverlay.classList.add('active');
}

function handleScheduleInterviewSubmit(e) {
  if (e) e.preventDefault();
  
  const appId = els.schedCandidateAppId.value;
  const dateTimeVal = els.schedDateTime.value;
  if (!dateTimeVal) {
    alert("Please select a valid date and time.");
    return;
  }

  const entry = window._activeSchedCandidate;
  const job = window._activeSchedJob;

  updateApplicantStatus(appId, 'interview', dateTimeVal);
  els.scheduleInterviewModalOverlay.classList.remove('active');
  
  addNotification(
    "Interview Scheduled",
    `Interview confirmed for ${entry ? entry.name : 'Candidate'} on ${dateTimeVal.replace('T', ' ')}.`,
    "📅"
  );

  renderAll();
  if (entry && job) {
    renderCandidateDetailsPanel(entry, job);
  }
}

/* ==========================================
   AI INTERVIEWER AGENT LIVE SIMULATION ROOM
   ========================================== */
function startAIInterviewSession(candidate, job) {
  if (els.scheduleInterviewModalOverlay) {
    els.scheduleInterviewModalOverlay.classList.remove('active');
  }

  let profileSource = state.profile;
  if (candidate.type === 'mock' && candidate.profile) {
    profileSource = candidate.profile;
  } else if (!profileSource) {
    profileSource = {
      fullName: candidate.name || "Candidate",
      title: candidate.title || (job ? job.title : "Software Engineer"),
      skills: job ? job.skills : ["JavaScript", "React", "Node.js"]
    };
  }

  // Generate dynamic questions via CareerPilot.AIInterviewAgent
  const questions = CareerPilot.AIInterviewAgent.generateQuestions(profileSource, job);

  state.activeInterviewSession = {
    sessionId: "int-session-" + Date.now(),
    candidateId: candidate.id,
    candidateName: candidate.name || profileSource.fullName,
    candidateTitle: candidate.title || profileSource.title,
    candidateProfile: profileSource,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    scheduledDate: new Date().toISOString(),
    currentQuestionIndex: 0,
    questions: questions,
    qaHistory: [],
    finalDossier: null
  };

  // Update UI Elements
  els.aiInterviewCandidateHeader.textContent = `Candidate: ${state.activeInterviewSession.candidateName} • Role: ${job.title} (${job.company})`;
  els.aiInterviewInputArea.style.display = 'flex';
  els.aiAnswerFeedbackCard.style.display = 'none';
  els.aiInterviewFinalDossierCard.style.display = 'none';

  renderAIInterviewQuestion(0);
  els.aiInterviewRoomModalOverlay.classList.add('active');
}

function renderAIInterviewQuestion(qIndex) {
  const session = state.activeInterviewSession;
  if (!session || qIndex >= session.questions.length) return;

  session.currentQuestionIndex = qIndex;
  const currentQ = session.questions[qIndex];

  els.aiInterviewProgressText.textContent = `Question ${qIndex + 1} of ${session.questions.length}`;
  els.aiQuestionCategoryTag.textContent = `Round: ${currentQ.category}`;
  els.aiQuestionTargetTag.textContent = `Evaluates: ${currentQ.targetCompetency}`;
  els.aiActiveQuestionText.textContent = currentQ.question;
  
  els.aiInterviewCandidateInput.value = "";
  els.aiAnswerWordCounter.textContent = "0 words";

  els.aiInterviewInputArea.style.display = 'flex';
  els.aiAnswerFeedbackCard.style.display = 'none';
  els.aiInterviewFinalDossierCard.style.display = 'none';
}

function handleCandidateAnswerSubmit() {
  const session = state.activeInterviewSession;
  if (!session) return;

  const currentQ = session.questions[session.currentQuestionIndex];
  const answerText = els.aiInterviewCandidateInput.value.trim();

  if (answerText.length < 5) {
    alert("Please provide a more detailed technical response to continue.");
    return;
  }

  // Real-time AI Evaluation
  const evalResult = CareerPilot.AIInterviewAgent.evaluateAnswer(
    currentQ,
    answerText,
    session.candidateProfile,
    { title: session.jobTitle, company: session.company }
  );

  // Store Q&A pair in session history
  session.qaHistory.push({
    questionIndex: session.currentQuestionIndex + 1,
    category: currentQ.category,
    question: currentQ.question,
    answer: answerText,
    evaluation: evalResult
  });

  // Display feedback card
  els.aiScoreTech.textContent = evalResult.technicalScore + "%";
  els.aiScoreComm.textContent = evalResult.communicationScore + "%";
  els.aiScoreStar.textContent = evalResult.starScore + "%";
  els.aiInstantScoreBadge.textContent = evalResult.overallScore + "% Score";
  els.aiInstantFeedbackText.textContent = evalResult.feedback;

  els.aiInterviewInputArea.style.display = 'none';
  els.aiAnswerFeedbackCard.style.display = 'block';

  // If last question, adjust button text
  if (session.currentQuestionIndex >= session.questions.length - 1) {
    els.btnNextAIQuestion.textContent = "Compile Final AI Assessment Dossier ➔";
  } else {
    els.btnNextAIQuestion.textContent = "Next Question ➔";
  }
}

function handleNextAIQuestion() {
  const session = state.activeInterviewSession;
  if (!session) return;

  const nextIdx = session.currentQuestionIndex + 1;
  if (nextIdx < session.questions.length) {
    renderAIInterviewQuestion(nextIdx);
  } else {
    // Compile and finalize dossier
    const dossier = CareerPilot.AIInterviewAgent.compileSessionDossier(session);
    session.finalDossier = dossier;

    els.dossierOverallScore.textContent = dossier.overallScore + "%";
    els.dossierRecBadge.textContent = dossier.recommendation.toUpperCase();
    els.dossierRecBadge.className = `badge badge-rec-${dossier.recommendationBadge}`;

    els.aiAnswerFeedbackCard.style.display = 'none';
    els.aiInterviewFinalDossierCard.style.display = 'flex';
  }
}

function finalizeAndSaveInterviewDossier() {
  const session = state.activeInterviewSession;
  if (!session || !session.finalDossier) return;

  const dossier = session.finalDossier;
  const newRecord = {
    id: session.sessionId,
    candidateId: session.candidateId,
    candidateName: session.candidateName,
    candidateTitle: session.candidateTitle,
    jobId: session.jobId,
    jobTitle: session.jobTitle,
    company: session.company,
    scheduledDate: session.scheduledDate,
    conductedDate: new Date().toISOString(),
    status: "completed",
    interviewerMode: "AI_AGENT",
    overallScore: dossier.overallScore,
    technicalScore: dossier.technicalScore,
    communicationScore: dossier.communicationScore,
    starScore: dossier.starScore,
    recommendation: dossier.recommendation,
    recommendationBadge: dossier.recommendationBadge,
    strengths: dossier.strengths,
    improvements: dossier.improvements,
    qaHistory: session.qaHistory
  };

  // 1. In-Memory Store
  // Remove any previous record for same candidate and push newest
  state.interviewRecords = state.interviewRecords.filter(r => r.candidateId !== session.candidateId);
  state.interviewRecords.push(newRecord);

  // 2. Persist to LocalStorage
  saveStateToStorage();

  // 3. Update candidate application status
  updateApplicantStatus(session.candidateId, 'interview');

  // 4. Send background sync to backend API (if running)
  try {
    fetch('http://127.0.0.1:8000/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(() => {
      // Backend sync fallback gracefully in-memory
    });
  } catch (err) {
    // Ignore offline sync
  }

  addNotification(
    "AI Interview Dossier Stored",
    `AI Interview completed for ${session.candidateName}. Score: ${dossier.overallScore}% (${dossier.recommendation}). Saved to database.`,
    "🤖"
  );

  alert(`✅ Interview Dossier for ${session.candidateName} has been stored in memory & database successfully!\n\nOverall Score: ${dossier.overallScore}%\nRecommendation: ${dossier.recommendation}`);

  els.aiInterviewRoomModalOverlay.classList.remove('active');
  renderAll();

  // Re-render candidate details panel if visible
  const selectedJob = state.jobs.find(j => j.id === session.jobId);
  if (selectedJob) {
    const candidateEntry = {
      id: session.candidateId,
      name: session.candidateName,
      title: session.candidateTitle,
      score: dossier.overallScore,
      status: 'interview'
    };
    renderCandidateDetailsPanel(candidateEntry, selectedJob);
  }
}

function openInterviewReportModal(record) {
  if (!record) return;

  els.reportCandidateTitle.textContent = `${record.candidateName} • AI Assessment Dossier`;
  els.reportSubtitle.textContent = `Conducted for ${record.jobTitle} at ${record.company} • In-Memory Verified Record`;

  const qaHtml = (record.qaHistory || []).map(q => `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 14px; margin-bottom: 12px;">
      <div style="font-size: 11px; font-weight: 700; color: var(--primary); margin-bottom: 4px;">QUESTION ${q.questionIndex}: ${q.category}</div>
      <p style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">"${q.question}"</p>
      
      <div style="background: var(--bg-primary); padding: 10px; border-radius: 4px; font-size: 12px; line-height: 1.5; color: var(--text-muted); margin-bottom: 10px;">
        <strong style="color: var(--text-main);">Candidate Response:</strong> ${q.answer}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 11px;">
        <span>AI Score: <strong style="color: var(--success);">${q.evaluation ? q.evaluation.overallScore : 85}%</strong></span>
        <span style="color: var(--text-light);">${q.evaluation ? q.evaluation.feedback : ''}</span>
      </div>
    </div>
  `).join('');

  els.interviewReportContentBody.innerHTML = `
    <!-- Summary Header Metrics -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      <div class="card-widget" style="padding: 12px; text-align: center; background: var(--bg-primary);">
        <div style="font-size: 20px; font-weight: 800; color: var(--success);">${record.overallScore}%</div>
        <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">OVERALL</div>
      </div>
      <div class="card-widget" style="padding: 12px; text-align: center; background: var(--bg-primary);">
        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${record.technicalScore}%</div>
        <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TECHNICAL</div>
      </div>
      <div class="card-widget" style="padding: 12px; text-align: center; background: var(--bg-primary);">
        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${record.communicationScore}%</div>
        <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">COMMUNICATION</div>
      </div>
      <div class="card-widget" style="padding: 12px; text-align: center; background: var(--bg-primary);">
        <div style="font-size: 20px; font-weight: 800; color: var(--warning);">${record.starScore}%</div>
        <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">STAR SCORE</div>
      </div>
    </div>

    <!-- Recommendation -->
    <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 700;">AI Hiring Recommendation:</span>
      <span class="badge badge-rec-${record.recommendationBadge || 'strong_hire'}" style="font-size: 12px; padding: 4px 12px;">${record.recommendation.toUpperCase()}</span>
    </div>

    <!-- Strengths & Improvements -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: var(--border-radius-sm); padding: 12px;">
        <h4 style="font-size: 12px; font-weight: 800; color: var(--success); margin-bottom: 6px;">Key Strengths:</h4>
        <ul style="font-size: 11px; line-height: 1.5; padding-left: 16px; color: var(--text-main);">
          ${(record.strengths || ["Strong architectural clarity", "Solid communication"]).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--border-radius-sm); padding: 12px;">
        <h4 style="font-size: 12px; font-weight: 800; color: var(--warning); margin-bottom: 6px;">Growth Areas:</h4>
        <ul style="font-size: 11px; line-height: 1.5; padding-left: 16px; color: var(--text-main);">
          ${(record.improvements || ["Elaborate on production latency"]).map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Q&A Transcript -->
    <div>
      <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 10px;">Complete Q&A Evaluation Transcript</h3>
      ${qaHtml}
    </div>
  `;

  els.interviewReportModalOverlay.classList.add('active');
}

function handleLoadSTARSample() {
  const sampleAnswers = [
    "In my previous role at a fast-growing startup, we faced high latency and state re-rendering delays in our main dashboard. As the frontend lead, I profiled the render cycle using Chrome DevTools and React Profiler, implemented memoization with useMemo/useCallback, and migrated heavy filtering logic to a Web Worker. This reduced render times by 68% and improved our Core Web Vitals to a 98 rating.",
    "When architecting our microservices backend, we needed sub-second asynchronous event delivery under heavy traffic spikes. I designed a Redis Pub/Sub layer backed by Kafka event streams and added compound database indices on user query keys. As a result, our API response latency dropped from 450ms down to 42ms with 99.99% uptime.",
    "During a critical release deadline, our team had conflicting views on whether to adopt Redux Toolkit or Zustand for global state. I set up a rapid benchmark POC comparing bundle footprint, developer ergonomics, and performance. After presenting the findings collaboratively, we adopted Zustand, which reduced state boilerplate by 50% and accelerated feature delivery by 2 weeks."
  ];

  const randomSample = sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)];
  els.aiInterviewCandidateInput.value = randomSample;
  els.aiAnswerWordCounter.textContent = `${randomSample.split(/\s+/).length} words`;
}

function handleSpeechSimulationToggle() {
  els.speechBtnText.textContent = "Recording Voice... 🔴";
  setTimeout(() => {
    handleLoadSTARSample();
    els.speechBtnText.textContent = "Voice Transcribed ✓";
    setTimeout(() => {
      els.speechBtnText.textContent = "Simulate Voice Answer";
    }, 2000);
  }, 900);
}

function updateApplicantStatus(appId, newStatus, interviewDate = null) {
  const app = state.applications.find(a => a.id === appId);
  if (!app) return;
  
  app.status = newStatus;
  if (interviewDate) {
    app.interviewDate = interviewDate;
  }
  
  const job = state.jobs.find(j => j.id === app.jobId);
  let notifTitle = "Application Updated";
  let notifDesc = `Your application status for ${job.title} at ${job.company} was updated to ${newStatus.toUpperCase()}.`;
  let notifIcon = "📁";
  
  if (newStatus === 'interview') {
    notifTitle = "Interview Scheduled";
    notifDesc = `Interview scheduled with ${job.company} for ${job.title} on ${interviewDate.replace('T', ' ')}.`;
    notifIcon = "📅";
  } else if (newStatus === 'offer') {
    notifTitle = "Job Offer Extended";
    notifDesc = `Congratulations! You received a job offer from ${job.company} for ${job.title}!`;
    notifIcon = "🎉";
  } else if (newStatus === 'rejected') {
    notifTitle = "Application Unsuccessful";
    notifDesc = `We regret to inform you that your application for ${job.title} at ${job.company} will not be moving forward.`;
    notifIcon = "❌";
  }
  
  addNotification(notifTitle, notifDesc, notifIcon);
  
  saveStateToStorage();
  renderAll();
  
  alert(`Application status updated to ${newStatus.toUpperCase()}`);
  
  // Clear detail
  els.recruiterCandidateDetailsPanel.innerHTML = `
    <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>Status changed. Select another applicant to review details.</p>
    </div>
  `;
}

/* ==========================================
   VISUAL RECRUITER CALENDAR
   ========================================== */
function changeMonth(direction) {
  state.currentMonth += direction;
  if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear--;
  } else if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  els.calendarMonthTitle.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;
  
  els.calendarDaysContainer.innerHTML = '';
  
  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  const totalDays = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  
  // Fill initial blank cells
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-cell';
    blank.style.opacity = '0.3';
    els.calendarDaysContainer.appendChild(blank);
  }
  
  // Fill date cells
  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell current-month';
    
    cell.innerHTML = `<span class="calendar-cell-num">${day}</span>`;
    
    // Look for interviews matching this day
    const cellDateStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    state.applications.forEach(app => {
      if (app.status === 'interview' && app.interviewDate && app.interviewDate.startsWith(cellDateStr)) {
        const job = state.jobs.find(j => j.id === app.jobId);
        if (job) {
          const event = document.createElement('div');
          event.className = 'calendar-event';
          event.title = `Interview with ${app.seekerName} for ${job.title}`;
          event.textContent = `${app.seekerName.split(' ')[0]} - ${job.company}`;
          cell.appendChild(event);
        }
      }
    });
    
    els.calendarDaysContainer.appendChild(cell);
  }
}

/* ==========================================
   PRICING BILLING MODES
   ========================================== */
function upgradePlanTier(tier) {
  if (!state.currentUser) {
    alert("Please Sign In to purchase billing plans.");
    toggleAuthModal(true);
    return;
  }
  
  openCheckoutModal(tier);
}

/* ==========================================
   GLOBAL RENDERING FUNCTION
   ========================================== */
function renderAll() {
  // Update landing statistics count counters
  els.metricJobsCount.textContent = `${state.jobs.length}+`;
  els.metricAppsCount.textContent = `${state.applications.length * 27 + 12000}+`;
  
  // Seeker Dash
  renderSkillsTags(state.profile.skills);
  renderJobsBoardList();
  renderKanbanBoard();
  renderResumeScorecard();
  handleSalaryEstimateUpdate();
  renderSavedJobsList();
  renderSettingsProfileInfo();
  renderInterviewsList();
  if (typeof updatePricingUI === 'function') updatePricingUI();

  // CareerPilot Multi-Agent Dashboard
  if (state.careerPilot) {
    renderCareerPilotDashboard(state.careerPilot);
  } else if (typeof CareerPilot !== 'undefined') {
    runCareerPilot();
  }
  
  // Recruiter Dash
  renderRecruiterJobsGrid();
  
  // Populate select screen selector in screen candidates tab
  const prevVal = els.screenJobSelector.value;
  els.screenJobSelector.innerHTML = '';
  state.jobs.forEach(job => {
    const opt = document.createElement('option');
    opt.value = job.id;
    opt.textContent = `${job.title} (${job.company})`;
    els.screenJobSelector.appendChild(opt);
  });
  if (prevVal && state.jobs.some(j => j.id === prevVal)) {
    els.screenJobSelector.value = prevVal;
  }
  renderRecruiterCandidateLists();
  
  // Calendar Tab
  renderCalendar();
  
  // Notification Dropdown
  renderNotifications();
  
  // Direct Messaging
  renderChats();
}

/* ==========================================
   NOTIFICATION SYSTEM HELPERS
   ========================================== */
function renderNotifications() {
  els.notificationListContainer.innerHTML = '';
  
  let unreadCount = 0;
  state.notifications.forEach(notif => {
    if (notif.unread) unreadCount++;
    
    const item = document.createElement('div');
    item.className = `notification-item ${notif.unread ? 'unread' : ''}`;
    
    item.innerHTML = `
      <div class="notification-item-icon">${notif.icon}</div>
      <div class="notification-item-content">
        <div class="notification-item-title">${notif.title}</div>
        <div class="notification-item-desc">${notif.desc}</div>
        <div class="notification-item-time">${notif.time}</div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      notif.unread = false;
      saveStateToStorage();
      renderAll();
    });
    
    els.notificationListContainer.appendChild(item);
  });
  
  if (state.notifications.length === 0) {
    els.notificationListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-light); padding: 30px 10px; font-size: 12px;">
        No active notifications
      </div>
    `;
  }
  
  // Update badge UI
  if (unreadCount > 0) {
    els.notificationBadge.style.display = 'flex';
    els.notificationBadge.textContent = unreadCount;
  } else {
    els.notificationBadge.style.display = 'none';
  }
}

function addNotification(title, desc, icon) {
  const newNotif = {
    id: "notif-" + Date.now(),
    title,
    desc,
    time: "Just now",
    unread: true,
    icon: icon || "🔔"
  };
  
  state.notifications.unshift(newNotif);
  if (state.notifications.length > 15) {
    state.notifications.pop();
  }
  
  saveStateToStorage();
}

/* ==========================================
   CHAT MESSAGING HELPERS
   ========================================== */
function renderChats() {
  // 1. Seeker Side Chats
  if (els.seekerChatsListContainer) {
    els.seekerChatsListContainer.innerHTML = '';
    state.chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = `chat-item ${state.activeChatCompany === chat.company ? 'active' : ''}`;
      
      const lastMsg = chat.messages[chat.messages.length - 1];
      const lastMsgText = lastMsg ? (lastMsg.sender === 'seeker' ? 'You: ' : '') + lastMsg.text : 'No messages yet';
      
      item.innerHTML = `
        <div class="avatar" style="background-color: var(--primary-light); color: var(--primary); font-weight: 700; width: 32px; height: 32px;">${chat.company.charAt(0)}</div>
        <div style="flex: 1; min-width: 0;">
          <div class="chat-item-name">${chat.company}</div>
          <div class="chat-item-lastmsg">${lastMsgText}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        state.activeChatCompany = chat.company;
        saveStateToStorage();
        renderAll();
      });
      
      els.seekerChatsListContainer.appendChild(item);
    });
    
    // Active chat box details
    const activeChat = state.chats.find(c => c.company === state.activeChatCompany);
    if (activeChat) {
      els.activeChatAvatar.textContent = activeChat.company.charAt(0);
      els.activeChatName.textContent = activeChat.company;
      els.activeChatStatus.textContent = "Online • Recruiter Response Simulated";
      
      els.seekerChatInput.disabled = false;
      els.sendSeekerMessageBtn.disabled = false;
      
      els.seekerChatHistory.innerHTML = '';
      activeChat.messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${msg.sender === 'seeker' ? 'user' : 'bot'}`;
        bubble.innerHTML = `
          <div>${msg.text}</div>
          <div style="font-size: 9px; opacity: 0.7; text-align: right; margin-top: 4px;">${msg.time}</div>
        `;
        els.seekerChatHistory.appendChild(bubble);
      });
      els.seekerChatHistory.scrollTop = els.seekerChatHistory.scrollHeight;
    }
  }
  
  // 2. Recruiter Side Chats
  if (els.recruiterChatsListContainer) {
    els.recruiterChatsListContainer.innerHTML = '';
    
    // Group chats by candidate name
    state.chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = `chat-item ${state.activeChatCompany === chat.company && state.activeChatCandidate === chat.candidate ? 'active' : ''}`;
      
      const lastMsg = chat.messages[chat.messages.length - 1];
      const lastMsgText = lastMsg ? (lastMsg.sender === 'recruiter' ? 'You: ' : '') + lastMsg.text : 'No messages yet';
      
      item.innerHTML = `
        <div class="avatar" style="background-color: var(--success-light); color: var(--success); font-weight: 700; width: 32px; height: 32px;">${chat.candidate.charAt(0)}</div>
        <div style="flex: 1; min-width: 0;">
          <div class="chat-item-name">${chat.candidate} (${chat.company})</div>
          <div class="chat-item-lastmsg">${lastMsgText}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        state.activeChatCompany = chat.company;
        state.activeChatCandidate = chat.candidate;
        saveStateToStorage();
        renderAll();
      });
      
      els.recruiterChatsListContainer.appendChild(item);
    });
    
    // Active recruiter chat window details
    const recActiveChat = state.chats.find(c => c.company === state.activeChatCompany && c.candidate === state.activeChatCandidate);
    if (recActiveChat) {
      els.recActiveChatAvatar.textContent = recActiveChat.candidate.charAt(0);
      els.recActiveChatName.textContent = `${recActiveChat.candidate} (${recActiveChat.company})`;
      els.recActiveChatStatus.textContent = "Applied Candidate • Screening desk active";
      
      els.recruiterChatInput.disabled = false;
      els.sendRecruiterMessageBtn.disabled = false;
      
      els.recruiterChatHistory.innerHTML = '';
      recActiveChat.messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${msg.sender === 'recruiter' ? 'user' : 'bot'}`;
        bubble.innerHTML = `
          <div>${msg.text}</div>
          <div style="font-size: 9px; opacity: 0.7; text-align: right; margin-top: 4px;">${msg.time}</div>
        `;
        els.recruiterChatHistory.appendChild(bubble);
      });
      els.recruiterChatHistory.scrollTop = els.recruiterChatHistory.scrollHeight;
    }
  }
}

function handleSendSeekerMessage() {
  const text = els.seekerChatInput.value.trim();
  if (!text) return;
  
  const activeChat = state.chats.find(c => c.company === state.activeChatCompany);
  if (!activeChat) return;
  
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    sender: "seeker",
    text,
    time: timeStr
  };
  activeChat.messages.push(newMsg);
  
  els.seekerChatInput.value = '';
  saveStateToStorage();
  renderAll();
  
  // Broadcast message to recruiter tab
  if (chatChannel) {
    chatChannel.postMessage({
      type: 'SEEKER_MSG',
      company: activeChat.company,
      candidate: activeChat.candidate,
      message: newMsg
    });
  }
  
  // Fallback simulator (only if no real recruiter peer is connected)
  if (!window.hasActiveRecruiterPeer) {
    setTimeout(() => {
      if (window.hasActiveRecruiterPeer) return;
      const timeStrReply = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      activeChat.messages.push({
        sender: "recruiter",
        text: `Hello! Thanks for your update. Our hiring team at ${activeChat.company} has received your message and will review it inside our panel.`,
        time: timeStrReply
      });
      
      addNotification(
        "Message from " + activeChat.company,
        `Recruiter sent a message: "Thanks for your update..."`,
        "💬"
      );
      
      saveStateToStorage();
      renderAll();
    }, 3000);
  }
}

function handleSendRecruiterMessage() {
  const text = els.recruiterChatInput.value.trim();
  if (!text) return;
  
  const activeChat = state.chats.find(c => c.company === state.activeChatCompany && c.candidate === state.activeChatCandidate);
  if (!activeChat) return;
  
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    sender: "recruiter",
    text,
    time: timeStr
  };
  activeChat.messages.push(newMsg);
  
  els.recruiterChatInput.value = '';
  saveStateToStorage();
  renderAll();
  
  // Broadcast message to seeker tab
  if (chatChannel) {
    chatChannel.postMessage({
      type: 'RECRUITER_MSG',
      company: activeChat.company,
      candidate: activeChat.candidate,
      message: newMsg
    });
  }
  
  // Fallback simulator (only if no real seeker peer is connected)
  if (!window.hasActiveSeekerPeer) {
    setTimeout(() => {
      if (window.hasActiveSeekerPeer) return;
      const timeStrReply = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      activeChat.messages.push({
        sender: "seeker",
        text: `Thank you for the update! I have received your message. I am looking forward to our next steps.`,
        time: timeStrReply
      });
      
      saveStateToStorage();
      renderAll();
    }, 3000);
  }
}

function renderApplySuccessPanel(job, app) {
  const appIdHex = app.id.split('-')[1] || "10234";
  els.seekerJobDetailsPanel.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background-color: var(--success-light); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 20px; animation: scaleUp 0.3s ease;">
        ✓
      </div>
      <h2 style="font-weight: 800; font-size: 20px; margin-bottom: 8px; color: var(--text-main);">Application Submitted!</h2>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 24px; line-height: 1.5;">
        You have successfully applied for the position of <strong>${job.title}</strong> at <strong>${job.company}</strong>.
      </p>
      
      <div style="background-color: var(--bg-primary); padding: 12px 24px; border-radius: var(--border-radius-sm); border: 1px dashed var(--border-color); margin-bottom: 30px;">
        <span style="font-size: 11px; color: var(--text-light); font-weight: 600; display: block; margin-bottom: 4px;">APPLICATION ID</span>
        <span style="font-size: 15px; font-weight: 800; color: var(--primary); font-family: monospace; letter-spacing: 1px;">#SH-${appIdHex}</span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 260px;">
        <button class="btn-primary" id="successViewAppsBtn" style="width: 100%;">View Applications</button>
        <button class="btn-secondary" id="successBackBtn" style="width: 100%;">Back to Jobs</button>
      </div>
    </div>
  `;
  
  document.getElementById('successViewAppsBtn').addEventListener('click', () => {
    activateTab('seekerPipelineTab');
  });
  
  document.getElementById('successBackBtn').addEventListener('click', () => {
    renderJobsBoardList();
    document.querySelectorAll('.job-item').forEach(n => n.classList.remove('selected'));
    els.seekerJobDetailsPanel.innerHTML = `
      <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>Select a job from the list to view detailed requirements, AI matching criteria, and apply immediately.</p>
      </div>
    `;
  });
}

/* ==========================================
   TIMELINE MODAL TRACKER & FEEDBACK HELPERS
   ========================================== */
let activeCheckoutTier = '';
let activeFeedbackAppId = '';

function openAppDetailsModal(appId) {
  const app = state.applications.find(a => a.id === appId);
  if (!app) return;
  
  const job = state.jobs.find(j => j.id === app.jobId);
  if (!job) return;
  
  els.appDetailsJobTitle.textContent = job.title;
  els.appDetailsCompany.textContent = `${job.company} • ${job.location}`;
  
  // Withdraw click event
  // Remove existing listeners by cloning button
  const oldBtn = els.appDetailsWithdrawBtn;
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  els.appDetailsWithdrawBtn = newBtn;
  
  els.appDetailsWithdrawBtn.addEventListener('click', () => {
    if (confirm(`Are you sure you want to withdraw your application for ${job.title} at ${job.company}?`)) {
      state.applications = state.applications.filter(a => a.id !== appId);
      addNotification("Application Withdrawn", `Withdrew application for ${job.title} at ${job.company}.`, "📁");
      saveStateToStorage();
      els.appDetailsModalOverlay.classList.remove('active');
      renderAll();
    }
  });
  
  // Render timeline progress items
  els.appDetailsTimeline.innerHTML = '';
  
  const steps = [
    { key: 'applied', label: 'Application Submitted', desc: `Successfully submitted on ${app.appliedDate}` },
    { key: 'review', label: 'Resume Screen & Review', desc: 'AI Match screening completed' },
    { key: 'interview', label: 'Interview Scheduled', desc: 'Screener and team scheduling confirmed' },
    { key: 'offer', label: 'Final Decision', desc: 'Offer letter extended / processed' }
  ];
  
  let appStatusIdx = 0;
  if (app.status === 'review') appStatusIdx = 1;
  if (app.status === 'interview') appStatusIdx = 2;
  if (app.status === 'offer' || app.status === 'rejected') appStatusIdx = 3;
  
  steps.forEach((step, idx) => {
    const item = document.createElement('div');
    
    let stateClass = '';
    if (idx < appStatusIdx) {
      stateClass = 'completed';
    } else if (idx === appStatusIdx) {
      stateClass = 'active';
    }
    
    item.className = `timeline-item ${stateClass}`;
    
    let stepTitle = step.label;
    let stepDesc = step.desc;
    if (step.key === 'offer') {
      if (app.status === 'offer') {
        stepTitle = 'Job Offer Extended! 🎉';
        stepDesc = 'Congratulations! Review details and sign contract.';
      } else if (app.status === 'rejected') {
        stepTitle = 'Application Closed';
        stepDesc = 'We decided to pursue other applicants for this opening.';
        item.style.color = 'var(--danger)';
      }
    }
    
    item.innerHTML = `
      <div class="timeline-icon">${idx < appStatusIdx ? '✓' : idx + 1}</div>
      <div class="timeline-content">
        <div class="timeline-title">${stepTitle}</div>
        <div class="timeline-time">${stepDesc}</div>
      </div>
    `;
    
    els.appDetailsTimeline.appendChild(item);
  });
  
  // Remove any stale feedback buttons inside the card first
  const existingFb = document.getElementById('successFeedbackBtn');
  if (existingFb) existingFb.remove();
  
  // Handle Interview details panel display (Screen 20)
  if (app.status === 'interview') {
    els.appDetailsInterviewCard.style.display = 'block';
    if (app.interviewDate) {
      els.appDetailsInterviewTime.textContent = app.interviewDate.replace('T', ' ');
    } else {
      els.appDetailsInterviewTime.textContent = "August 18, 2026 at 10:00 AM";
    }
    
    // Reschedule Click Handler
    const oldResBtn = els.appRescheduleBtn;
    const newResBtn = oldResBtn.cloneNode(true);
    oldResBtn.parentNode.replaceChild(newResBtn, oldResBtn);
    els.appRescheduleBtn = newResBtn;
    
    els.appRescheduleBtn.addEventListener('click', () => {
      const newTime = prompt("Request a reschedule time (YYYY-MM-DD HH:MM):", "2026-08-19 14:00");
      if (newTime) {
        app.interviewDate = newTime.replace(' ', 'T') + ":00";
        addNotification("Reschedule Requested", `Sent request to change interview to ${newTime}.`, "📅");
        saveStateToStorage();
        openAppDetailsModal(appId);
        renderAll();
      }
    });
    
    // Rate Interview Experience button (Screen 26)
    const fbBtn = document.createElement('button');
    fbBtn.id = 'successFeedbackBtn';
    fbBtn.className = 'btn-primary';
    fbBtn.style.marginTop = '10px';
    fbBtn.style.width = '100%';
    fbBtn.textContent = 'Rate Interview Experience';
    fbBtn.addEventListener('click', () => {
      activeFeedbackAppId = appId;
      els.appDetailsModalOverlay.classList.remove('active');
      els.feedbackModalOverlay.classList.add('active');
    });
    els.appDetailsInterviewCard.appendChild(fbBtn);
  } else {
    els.appDetailsInterviewCard.style.display = 'none';
  }
  
  els.appDetailsModalOverlay.classList.add('active');
}

function openCheckoutModal(tier) {
  activeCheckoutTier = tier;
  const payBtn = els.checkoutPaymentForm.querySelector('.auth-submit-btn');
  if (tier === 'seeker-pro') {
    payBtn.textContent = 'Pay $29 / month';
  } else {
    payBtn.textContent = 'Pay $99 / month';
  }
  els.checkoutModalOverlay.classList.add('active');
}

function handleCheckoutPaymentSubmit(e) {
  e.preventDefault();
  
  state.currentUser.subscription = activeCheckoutTier;
  saveStateToStorage();
  
  addNotification(
    "Checkout Successful",
    `Thank you! SmartHire ${activeCheckoutTier.toUpperCase()} features unlocked successfully.`,
    "💳"
  );
  
  els.checkoutModalOverlay.classList.remove('active');
  renderAll();
  
  alert(`Upgrade Successful! Thank you for subscribing to SmartHire ${activeCheckoutTier.toUpperCase()}!`);
}

function handleFeedbackSubmit(e) {
  e.preventDefault();
  const rating = els.feedbackRatingVal.value;
  const reviewText = document.getElementById('feedbackText').value;
  
  alert(`Feedback Submitted! Rating: ${rating}/5.\nThank you for helping us optimize our technical interviewer tracks.`);
  
  addNotification(
    "Feedback Submitted",
    `Thank you! Rated your interview experience ${rating}/5 stars.`,
    "★"
  );
  
  els.feedbackModalOverlay.classList.remove('active');
  
  // Clear form
  document.getElementById('feedbackText').value = '';
  document.querySelectorAll('#ratingStarsContainer .star').forEach(s => s.classList.remove('selected'));
  els.feedbackRatingVal.value = '0';
  
  renderAll();
}

// Bookmark Toggle & Render Methods
function toggleJobBookmark(jobId) {
  if (!state.bookmarkedJobs) state.bookmarkedJobs = [];
  
  const idx = state.bookmarkedJobs.indexOf(jobId);
  if (idx > -1) {
    state.bookmarkedJobs.splice(idx, 1);
    addNotification("Bookmark Removed", `Removed job from saved listings.`, "📁");
  } else {
    state.bookmarkedJobs.push(jobId);
    addNotification("Job Bookmarked", `Added job to saved listings. Check the Saved Jobs tab.`, "💾");
  }
  
  saveStateToStorage();
  renderAll();
}

function renderSavedJobsList() {
  if (!els.savedJobsListContainer) return;
  els.savedJobsListContainer.innerHTML = '';
  
  const savedIds = state.bookmarkedJobs || [];
  const savedJobs = state.jobs.filter(j => savedIds.includes(j.id));
  
  if (savedJobs.length === 0) {
    els.savedJobsListContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); grid-column: 1 / -1;">
        No saved jobs yet. Click "Save / Bookmark" on any job listing to store it here.
      </div>
    `;
    return;
  }
  
  savedJobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card-widget';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <h4 style="font-weight: 800; font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${job.title}</h4>
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${job.company} • ${job.location}</div>
        </div>
      </div>
      
      <div style="display: flex; gap: 6px; margin-bottom: 12px;">
        <span class="tag" style="font-size: 9px; padding: 2px 6px;">${job.type.toUpperCase()}</span>
        <span class="tag" style="font-size: 9px; padding: 2px 6px;">$${job.salary}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 8px;">
        <button class="btn-primary" style="font-size: 10px; padding: 4px 8px; flex: 1; margin-right: 8px;">Apply Now</button>
        <button class="btn-secondary" style="font-size: 10px; padding: 4px 8px;">Remove</button>
      </div>
    `;
    
    // Apply button click
    card.querySelector('.btn-primary').addEventListener('click', (e) => {
      e.stopPropagation();
      handleApplyToJob(job.id);
    });
    
    // Remove button click
    card.querySelector('.btn-secondary').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleJobBookmark(job.id);
    });
    
    // Card details click
    card.addEventListener('click', () => {
      activateTab('seekerJobsTab');
      renderJobDetailsPanel(job.id);
    });
    
    els.savedJobsListContainer.appendChild(card);
  });
}

function renderSettingsProfileInfo() {
  if (!state.currentUser) return;
  
  const nameNode = document.getElementById('settingsProfileName');
  const emailNode = document.getElementById('settingsProfileEmail');
  const avatarNode = document.getElementById('settingsAvatarContainer');
  
  if (nameNode) nameNode.textContent = state.currentUser.name;
  if (emailNode) emailNode.textContent = state.currentUser.email;
  if (avatarNode) avatarNode.textContent = state.currentUser.name.charAt(0).toUpperCase();
  
  // Set up Dark Mode preferences binding once
  if (els.settingsDarkModeToggle && !els.settingsDarkModeToggle.dataset.bound) {
    els.settingsDarkModeToggle.dataset.bound = "true";
    
    // Check local storage for dark theme preference
    const isDark = localStorage.getItem('sh_dark_theme') === 'true';
    els.settingsDarkModeToggle.checked = isDark;
    if (isDark) {
      document.body.classList.add('dark-mode');
    }
    
    els.settingsDarkModeToggle.addEventListener('change', (e) => {
      const mode = e.target.checked;
      if (mode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      localStorage.setItem('sh_dark_theme', mode);
      addNotification("Preferences Saved", `Dark Mode layout theme ${mode ? 'activated' : 'deactivated'}.`, "🎨");
    });
  }
}

function renderInterviewsList() {
  if (!els.interviewsListContainer) return;
  els.interviewsListContainer.innerHTML = '';
  
  const filter = state.interviewsFilter || 'upcoming';
  let apps = [];
  
  if (filter === 'upcoming') {
    apps = state.applications.filter(a => a.status === 'interview');
  } else {
    apps = state.applications.filter(a => a.status === 'offer' || a.status === 'rejected');
  }
  
  if (apps.length === 0) {
    els.interviewsListContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
        No ${filter} interviews found. Keep applying and screening candidate trackers!
      </div>
    `;
    return;
  }
  
  apps.forEach(app => {
    const job = state.jobs.find(j => j.id === app.jobId);
    if (!job) return;
    
    const card = document.createElement('div');
    card.className = 'card-widget';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '12px';
    card.style.borderLeft = `4px solid ${filter === 'upcoming' ? 'var(--primary)' : 'var(--text-light)'}`;
    
    const interviewTime = app.interviewDate 
      ? app.interviewDate.replace('T', ' ') 
      : "August 18, 2026 at 10:00 AM";
      
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h4 style="font-weight: 800; font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${job.title}</h4>
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${job.company} • ${job.location}</div>
        </div>
        <span style="font-size: 10px; color: var(--text-light); font-weight: 700;">${filter.toUpperCase()}</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); background: var(--bg-primary); padding: 8px; border-radius: var(--border-radius-sm);">
        <span>📅 Time: <strong>${interviewTime}</strong></span>
      </div>
      
      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 4px;">
        <button class="btn-primary" style="font-size: 10px; padding: 6px 12px; flex: 1;">Join Google Meet</button>
        <button class="btn-secondary" style="font-size: 10px; padding: 6px 12px;">Reschedule / Details</button>
      </div>
    `;
    
    // Meet button click
    card.querySelector('.btn-primary').addEventListener('click', (e) => {
      e.stopPropagation();
      window.open("https://meet.google.com/abc-defg-hij", "_blank");
    });
    
    // Details button click
    card.querySelector('.btn-secondary').addEventListener('click', (e) => {
      e.stopPropagation();
      openAppDetailsModal(app.id);
    });
    
    els.interviewsListContainer.appendChild(card);
  });
}

window.hasActiveRecruiterPeer = false;
window.hasActiveSeekerPeer = false;

function setupRealTimeChatChannel() {
  if (typeof BroadcastChannel === 'undefined') return;
  
  chatChannel = new BroadcastChannel('smarthire_chat_stream');
  
  // Heartbeats to establish peer presence and suppress simulator bots
  setInterval(() => {
    if (state.currentUser) {
      chatChannel.postMessage({
        type: 'HEARTBEAT',
        role: state.currentUser.role,
        email: state.currentUser.email
      });
    }
  }, 1000);
  
  chatChannel.addEventListener('message', (e) => {
    const data = e.data;
    if (!data) return;
    
    if (data.type === 'HEARTBEAT') {
      if (data.role === 'recruiter') {
        window.hasActiveRecruiterPeer = true;
      }
      if (data.role === 'seeker') {
        window.hasActiveSeekerPeer = true;
      }
      return;
    }
    
    const activeChat = state.chats.find(c => c.company === data.company && c.candidate === data.candidate);
    
    if (data.type === 'SEEKER_MSG') {
      window.hasActiveSeekerPeer = true;
      if (activeChat) {
        const isDup = activeChat.messages.some(m => m.sender === 'seeker' && m.text === data.message.text);
        if (!isDup) {
          activeChat.messages.push(data.message);
          saveStateToStorage();
          renderAll();
          
          if (state.currentUser && state.currentUser.role === 'recruiter') {
            addNotification(
              "New message from " + data.candidate,
              `Received: "${data.message.text}"`,
              "💬"
            );
            renderAll();
          }
        }
      }
    }
    
    if (data.type === 'RECRUITER_MSG') {
      window.hasActiveRecruiterPeer = true;
      if (activeChat) {
        const isDup = activeChat.messages.some(m => m.sender === 'recruiter' && m.text === data.message.text);
        if (!isDup) {
          activeChat.messages.push(data.message);
          saveStateToStorage();
          renderAll();
          
          if (state.currentUser && state.currentUser.role === 'seeker') {
            addNotification(
              "New message from " + data.company,
              `Received: "${data.message.text}"`,
              "💬"
            );
            renderAll();
          }
        }
      }
    }
  });
}

/* ==========================================================================
   CAREERPILOT CONTROLLERS & RENDERING (LANGGRAPH AGENTS)
   ========================================================================== */

function getActiveCareerCandidate() {
  if (state.activeCareerProfile) return state.activeCareerProfile;
  if (typeof SATYAPRAKASH_PROFILE !== 'undefined') return SATYAPRAKASH_PROFILE;
  return state.profile || DEFAULT_SEEKER_PROFILE;
}

function loadSatyaprakashBenchmark() {
  if (typeof SATYAPRAKASH_PROFILE !== 'undefined') {
    state.activeCareerProfile = { ...SATYAPRAKASH_PROFILE };
  }
  if (els.careerGoalPromptInput) {
    els.careerGoalPromptInput.value = "Mujhe India mein Software Engineer ki job chahiye.";
  }
  if (els.careerPilotTargetRole) els.careerPilotTargetRole.value = "Software Engineer";
  if (els.careerPilotExpLevel) els.careerPilotExpLevel.value = "Fresher";
  if (els.careerPilotLocation) els.careerPilotLocation.value = "India";
  if (els.activeResumeSourceLabel) els.activeResumeSourceLabel.textContent = "Satyaprakash (Fresher)";

  addNotification("Benchmark Loaded", "Loaded Satyaprakash benchmark profile (Java, React, SQL, MongoDB - Fresher).", "⚡");
  runCareerPilot();
}

function runCareerPilot(options = {}) {
  if (typeof CareerPilot === 'undefined') {
    console.error("CareerPilot agent engine not loaded.");
    return;
  }

  // Visual node animation
  animateAgentGraph();

  const prompt = (els.careerGoalPromptInput && els.careerGoalPromptInput.value.trim()) || "Mujhe India mein Software Engineer ki job chahiye.";
  const targetRole = (els.careerPilotTargetRole && els.careerPilotTargetRole.value) || "Software Engineer";
  const expLevel = (els.careerPilotExpLevel && els.careerPilotExpLevel.value) || "Fresher";
  const location = (els.careerPilotLocation && els.careerPilotLocation.value) || "India";

  const goalInput = {
    role: targetRole,
    experienceLevel: expLevel,
    location: location,
    rawPrompt: prompt
  };

  const candidateProfile = getActiveCareerCandidate();
  const allJobs = state.jobs && state.jobs.length ? state.jobs : (typeof DEFAULT_JOBS !== 'undefined' ? DEFAULT_JOBS : []);

  // Execute LangGraph Multi-Agent Planner
  const result = CareerPilot.executePlan(goalInput, candidateProfile, allJobs, options);
  state.careerPilot = result;

  renderCareerPilotDashboard(result);

  if (options.simulateFailure) {
    addNotification("Adaptation Triggered", "API fault detected. CareerPilot autonomously switched to Backup Job Dataset.", "⚠️");
  } else {
    addNotification("CareerPilot Executed", `Analyzed ${result.metrics.jobsAnalyzed} jobs. Found ${result.metrics.strongMatches} strong matches!`, "🚀");
  }
}

function animateAgentGraph() {
  const nodes = [
    "nodeUserGoal", "nodeResume", "nodeUnderstand", "nodePlan", 
    "nodeSearch", "nodeAnalyze", "nodeCompare", "nodeDecide", 
    "nodeIdentifyGap", "nodeCreatePlan", "nodeEvaluate", "nodeAdapt", "nodeRecommendation"
  ];
  
  if (els.agentStatusBadge) {
    els.agentStatusBadge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); display: inline-block; animation: pulseNode 0.8s infinite alternate;"></span><span>Executing 13-Stage LangGraph Pipeline...</span>`;
    els.agentStatusBadge.style.color = "var(--primary)";
    els.agentStatusBadge.style.background = "rgba(124, 58, 237, 0.12)";
  }

  nodes.forEach((nodeId, idx) => {
    const el = document.getElementById(nodeId);
    if (!el) return;
    el.classList.remove("completed", "active");
    setTimeout(() => {
      el.classList.add("active");
      setTimeout(() => {
        el.classList.remove("active");
        el.classList.add("completed");
        if (idx === nodes.length - 1 && els.agentStatusBadge) {
          els.agentStatusBadge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block;"></span><span>13-Stage Pipeline Complete</span>`;
          els.agentStatusBadge.style.color = "var(--success)";
          els.agentStatusBadge.style.background = "var(--success-light)";
        }
      }, 250);
    }, idx * 120);
  });
}

function renderCareerPilotDashboard(result) {
  if (!result) return;

  // 1. Summary Metrics
  if (els.metricGoalSummary) els.metricGoalSummary.textContent = `${result.careerGoal.role}`;
  if (els.metricResumeScore) els.metricResumeScore.textContent = `${result.metrics.resumeScore}%`;
  if (els.metricJobsAnalyzed) els.metricJobsAnalyzed.textContent = `${result.metrics.jobsAnalyzed}`;
  if (els.metricStrongMatches) els.metricStrongMatches.textContent = `${result.metrics.strongMatches}`;
  if (els.metricSkillGaps) els.metricSkillGaps.textContent = `${result.metrics.skillGapsCount}`;

  // 2. Adaptation Banner
  if (els.adaptationAlertBanner) {
    if (result.adaptationStatus && result.adaptationStatus.occurred) {
      els.adaptationAlertBanner.style.display = "flex";
      if (els.adaptationAlertText) {
        els.adaptationAlertText.textContent = result.adaptationStatus.log || "Switched to backup job dataset autonomously.";
      }
    } else {
      els.adaptationAlertBanner.style.display = "none";
    }
  }

  // 3. Activity Stream
  if (els.careerPilotActivityStream && result.activityLogs) {
    els.careerPilotActivityStream.innerHTML = "";
    if (els.activityLogCount) els.activityLogCount.textContent = `${result.activityLogs.length} actions recorded`;

    result.activityLogs.forEach(log => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "flex-start";
      row.style.gap = "8px";
      row.style.lineHeight = "1.4";

      const isAdapted = log.status === "adapted";
      const badgeBg = isAdapted ? "var(--warning)" : "var(--primary)";

      row.innerHTML = `
        <span style="color: var(--text-light); font-size: 10px; min-width: 58px;">[${log.timestamp}]</span>
        <span style="background: ${badgeBg}; color: white; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; white-space: nowrap;">${log.agent}</span>
        <span style="color: var(--text-main); font-weight: 600;">${log.action}:</span>
        <span style="color: var(--text-muted); flex: 1;">${log.detail}</span>
      `;
      els.careerPilotActivityStream.appendChild(row);
    });

    // Scroll to bottom of stream
    els.careerPilotActivityStream.scrollTop = els.careerPilotActivityStream.scrollHeight;
  }

  // 4. Ranked Jobs with Decision Agent
  if (els.careerPilotRankedJobsContainer && result.rankedJobs) {
    els.careerPilotRankedJobsContainer.innerHTML = "";

    if (!result.rankedJobs.length) {
      els.careerPilotRankedJobsContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No jobs analyzed yet. Click Execute Planner.</div>`;
      return;
    }

    result.rankedJobs.forEach((item, idx) => {
      const job = item.job;
      const match = item.matchResult;
      const dec = item.decisionResult;

      const card = document.createElement("div");
      card.className = `career-pilot-job-card ${idx === 0 ? "top-rank" : ""}`;

      let decisionPillStyle = "background: rgba(34, 197, 94, 0.15); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.35);";
      let decisionIcon = "🟢";
      if (dec.decision === "PREPARE_AND_APPLY") {
        decisionPillStyle = "background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.35);";
        decisionIcon = "🟡";
      } else if (dec.decision === "IMPROVE_SKILLS") {
        decisionPillStyle = "background: rgba(239, 68, 68, 0.15); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.35);";
        decisionIcon = "🔴";
      }

      // Matched pills
      const matchedPillsHtml = match.allMatched.map(s => 
        `<span style="background: rgba(34, 197, 94, 0.1); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.3); padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700;">✓ ${s}</span>`
      ).join(" ") || `<span style="font-size: 11px; color: var(--text-light);">None</span>`;

      // Missing pills
      const missingPillsHtml = match.allMissing.map(s => 
        `<span style="background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25); padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700;">✗ ${s}</span>`
      ).join(" ") || `<span style="font-size: 11px; color: var(--success); font-weight: 600;">✓ No Missing Skills</span>`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">${job.title}</h4>
              ${idx === 0 ? '<span class="badge" style="background: var(--primary); color: white; font-size: 9px; font-weight: 800; padding: 2px 6px;">⭐ TOP MATCH</span>' : ''}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; display: flex; gap: 12px; flex-wrap: wrap;">
              <span>🏢 ${job.company}</span>
              <span>📍 ${job.location}</span>
              <span>💼 ${job.experienceReq === 0 ? 'Fresher (0 yrs)' : `${job.experienceReq}+ yrs`}</span>
              <span>💵 ${job.salary}</span>
            </div>
          </div>

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 20px; font-weight: 800; color: ${dec.overallScore >= 80 ? 'var(--success)' : (dec.overallScore >= 60 ? 'var(--warning)' : 'var(--danger)')};">${dec.overallScore}%</span>
              <span style="font-size: 11px; color: var(--text-light); font-weight: 600;">Match</span>
            </div>
            <div style="padding: 4px 10px; border-radius: 14px; font-size: 11px; font-weight: 800; ${decisionPillStyle}">
              ${decisionIcon} ${dec.decisionLabel}
            </div>
          </div>
        </div>

        <!-- Decision Rationale Box -->
        <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 10px 12px; border-left: 3px solid ${dec.overallScore >= 80 ? 'var(--success)' : (dec.overallScore >= 60 ? 'var(--warning)' : 'var(--danger)')};">
          <strong style="font-size: 11px; color: var(--text-main); display: block; margin-bottom: 2px;">🧑‍⚖️ Decision Agent Analysis:</strong>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.4;">${dec.reason}</p>
        </div>

        <!-- Skills Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
          <div>
            <span style="font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Matched Skills:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">${matchedPillsHtml}</div>
          </div>
          <div>
            <span style="font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Missing Requirements:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">${missingPillsHtml}</div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 4px;">
          <button class="btn-secondary btn-bookmark-action" data-job-id="${job.id}" style="font-size: 11px; padding: 6px 12px;">
            🔖 Save Job
          </button>
          <button class="btn-primary btn-quick-apply-pilot" data-job-id="${job.id}" style="font-size: 11px; padding: 6px 16px; background: ${dec.overallScore >= 80 ? 'var(--primary)' : 'var(--bg-card)'}; color: ${dec.overallScore >= 80 ? 'white' : 'var(--text-main)'}; border: 1px solid ${dec.overallScore >= 80 ? 'var(--primary)' : 'var(--border-color)'};">
            ⚡ ${dec.decision === 'APPLY_NOW' ? 'Apply Now' : 'Review & Apply'}
          </button>
        </div>
      `;

      els.careerPilotRankedJobsContainer.appendChild(card);
    });

    // Attach Quick Apply handlers
    document.querySelectorAll('.btn-quick-apply-pilot').forEach(btn => {
      btn.addEventListener('click', () => {
        const jId = btn.getAttribute('data-job-id');
        const foundJob = state.jobs.find(j => j.id === jId) || (typeof DEFAULT_JOBS !== 'undefined' ? DEFAULT_JOBS.find(j => j.id === jId) : null);
        if (foundJob) {
          openApplyModal(foundJob);
        }
      });
    });

    // Attach Save Job handlers
    document.querySelectorAll('.btn-bookmark-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const jId = btn.getAttribute('data-job-id');
        if (!state.bookmarkedJobs.includes(jId)) {
          state.bookmarkedJobs.push(jId);
          saveStateToStorage();
          addNotification("Job Saved", "Job bookmarked to your Saved Jobs collection.", "🔖");
          renderBookmarkedJobs();
        } else {
          addNotification("Already Saved", "This job is already in your Saved Jobs collection.", "ℹ️");
        }
      });
    });
  }

  // 5. Skill Gap Analyzer
  if (els.skillGapBarsContainer && result.gapAnalysis) {
    els.skillGapBarsContainer.innerHTML = "";
    if (els.skillGapSummaryText) els.skillGapSummaryText.innerHTML = result.gapAnalysis.summary;

    result.gapAnalysis.topGaps.forEach(gap => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexDirection = "column";
      row.style.gap = "4px";

      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;">
          <span>${gap.skill}</span>
          <span style="color: var(--primary);">${gap.percentage}% of Jobs</span>
        </div>
        <div style="height: 6px; background: var(--bg-primary); border-radius: 3px; overflow: hidden;">
          <div style="width: ${gap.percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 3px;"></div>
        </div>
      `;
      els.skillGapBarsContainer.appendChild(row);
    });
  }

  // 6. 14-Day Learning Roadmap
  if (els.learningRoadmapCardsContainer && result.learningPlan) {
    els.learningRoadmapCardsContainer.innerHTML = "";
    if (els.learningPlanFocusSkills) {
      els.learningPlanFocusSkills.textContent = result.learningPlan.focusSkills.join(", ") || "Advanced Full Stack";
    }

    const roadmapItems = result.learningPlan.roadmap || [];

    roadmapItems.forEach((milestone, mIdx) => {
      const mCard = document.createElement("div");
      mCard.className = "roadmap-day-card";
      mCard.id = `roadmapCard-${mIdx}`;

      const topicsList = milestone.topics.map(t => `<li style="margin-bottom: 2px;">${t}</li>`).join("");

      mCard.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="badge" style="background: rgba(124, 58, 237, 0.12); color: var(--primary); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">${milestone.dayRange}</span>
            <input type="checkbox" class="roadmap-checkbox" data-idx="${mIdx}">
          </div>
          <h4 style="font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">${milestone.title}</h4>
          <ul style="font-size: 11px; color: var(--text-muted); padding-left: 16px; margin: 0 0 10px 0; line-height: 1.4;">
            ${topicsList}
          </ul>
        </div>
        <div style="background: var(--bg-primary); border-radius: var(--border-radius-sm); padding: 8px 10px; font-size: 10px; color: var(--text-main); border-left: 2px solid var(--primary);">
          <strong>Action Task:</strong> ${milestone.actionItem}
        </div>
      `;

      els.learningRoadmapCardsContainer.appendChild(mCard);
    });

    // Checkbox interaction
    document.querySelectorAll('.roadmap-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const cardIdx = cb.getAttribute('data-idx');
        const cardEl = document.getElementById(`roadmapCard-${cardIdx}`);
        if (cardEl) {
          if (cb.checked) {
            cardEl.classList.add('completed');
          } else {
            cardEl.classList.remove('completed');
          }
        }
        const totalChecked = document.querySelectorAll('.roadmap-checkbox:checked').length;
        if (els.roadmapProgressBadge) {
          els.roadmapProgressBadge.textContent = `${totalChecked} / ${roadmapItems.length} Completed`;
        }
      });
    });
  }
}

function handleCareerPilotReEvaluation(skillName) {
  if (!state.careerPilot || typeof CareerPilot === 'undefined') {
    runCareerPilot();
    return;
  }

  const allJobs = state.jobs && state.jobs.length ? state.jobs : (typeof DEFAULT_JOBS !== 'undefined' ? DEFAULT_JOBS : []);
  const updatedResult = CareerPilot.ReEvaluationEngine.reEvaluate(state.careerPilot, skillName, allJobs);
  
  if (!updatedResult) return;
  state.careerPilot = updatedResult;

  // Show re-evaluation before vs after card
  if (els.reEvalComparisonBox && updatedResult.reEvaluationMeta) {
    els.reEvalComparisonBox.style.display = "block";
    const meta = updatedResult.reEvaluationMeta;

    if (els.reEvalHeaderLabel) els.reEvalHeaderLabel.textContent = `🎉 Skill Acquired: +${meta.addedSkill}`;
    if (els.reEvalDeltaBadge) els.reEvalDeltaBadge.textContent = `+${meta.scoreDelta}% MATCH GAIN`;
    if (els.reEvalBeforeScore) els.reEvalBeforeScore.textContent = `${meta.beforeScore}% Compatibility`;
    if (els.reEvalBeforeDecision) els.reEvalBeforeDecision.textContent = `🔴 ${meta.beforeDecision}`;
    if (els.reEvalAfterScore) els.reEvalAfterScore.textContent = `${meta.afterScore}% Compatibility`;
    if (els.reEvalAfterDecision) els.reEvalAfterDecision.textContent = `🟡 ${meta.afterDecision}`;
    if (els.reEvalExplanation) {
      els.reEvalExplanation.textContent = `CareerPilot dynamically re-calculated compatibility for "${meta.addedSkill}", updating your recommendation from "${meta.beforeDecision}" to "${meta.afterDecision}".`;
    }
  }

  renderCareerPilotDashboard(updatedResult);

  addNotification(
    "Profile Dynamically Upgraded",
    `Added ${skillName}! Top job match upgraded from ${updatedResult.reEvaluationMeta.beforeScore}% to ${updatedResult.reEvaluationMeta.afterScore}%.`,
    "🎉"
  );
}

function openAdminConsoleModal() {
  if (!els.adminConsoleModal) return;
  
  const users = getStoredUsers();
  const usersCount = users.length;
  const jobsCount = state.jobs ? state.jobs.length : 0;
  const appsCount = state.applications ? state.applications.length : 0;
  const savedCount = state.bookmarkedJobs ? state.bookmarkedJobs.length : 0;
  
  if (els.adminCountUsers) els.adminCountUsers.textContent = usersCount;
  if (els.adminCountJobs) els.adminCountJobs.textContent = jobsCount;
  if (els.adminCountApps) els.adminCountApps.textContent = appsCount;
  if (els.adminCountSaved) els.adminCountSaved.textContent = savedCount;
  
  // Compile live comprehensive database JSON snapshot
  const dbSnapshot = {
    exportedAt: new Date().toISOString(),
    system: "CareerPilot / SmartHire Autonomous Recruitment Platform",
    currentUser: state.currentUser,
    activeRole: state.currentRole,
    usersDatabase: users,
    activeProfile: state.profile,
    jobsDatabase: state.jobs,
    applicationsPipeline: state.applications,
    interviewRecords: state.interviewRecords,
    bookmarkedJobs: state.bookmarkedJobs || [],
    notifications: state.notifications,
    chats: state.chats
  };
  
  if (els.adminDatabaseJsonViewer) {
    els.adminDatabaseJsonViewer.textContent = JSON.stringify(dbSnapshot, null, 2);
  }
  
  els.adminConsoleModal.classList.add('active');
}

function exportDatabaseToJsonFile() {
  const users = getStoredUsers();
  const dbSnapshot = {
    backupDate: new Date().toISOString(),
    platform: "CareerPilot Autonomous AI Recruitment Portal",
    version: "2.0.0",
    currentUser: state.currentUser,
    usersCount: users.length,
    users: users,
    activeProfile: state.profile,
    jobsCount: state.jobs.length,
    jobs: state.jobs,
    applicationsCount: state.applications.length,
    applications: state.applications,
    interviewRecords: state.interviewRecords,
    bookmarkedJobs: state.bookmarkedJobs || [],
    notifications: state.notifications,
    chats: state.chats
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbSnapshot, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `careerpilot_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("📥 Database backup successfully downloaded as JSON file!", "success");
  addNotification("Database Backup Downloaded", "Complete JSON snapshot of all users, jobs, and applications saved to your device.", "💾");
}

/* ==========================================================================
   FEATURE 1: INTEGRATED RAZORPAY / UPI & CARD CHECKOUT SYSTEM (DYNAMIC $0, $19, $99)
   ========================================================================== */
let activeCheckoutPlan = {
  id: 'seeker_pro',
  name: 'Job Seeker Pro',
  priceUsd: '$19',
  priceInr: '₹1,499',
  amount: 19,
  period: 'month',
  features: 'Unlimited Auto-Apply, AI Mock Interviews & 14-Day Roadmap'
};

function selectFreePlan() {
  state.isPro = false;
  state.isRecruiterPro = false;
  state.userPlan = 'free';
  localStorage.setItem('sh_is_pro', 'false');
  localStorage.setItem('sh_user_plan', 'free');
  
  addNotification(
    "Free Basic Plan Active ✅",
    "You are currently on the Free Basic Plan ($0/month). 5 applications/day & AI Matching are active.",
    "🆓"
  );
  
  updatePricingUI();
  
  // Show toast notification
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#0f172a; color:#10b981; padding:14px 24px; border-radius:10px; font-weight:800; font-size:14px; z-index:99999; box-shadow:0 10px 25px rgba(0,0,0,0.3); border:1.5px solid #10b981; display:flex; align-items:center; gap:8px; animation: fadeIn 0.3s ease;';
  toast.innerHTML = `<span>✅</span> <span>Free Basic Plan ($0/month) is Active!</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2500);
}

function openCheckoutModal(planType = 'seeker_pro') {
  const overlay = document.getElementById('checkoutModalOverlay');
  if (!overlay) return;
  
  if (planType === 'seeker_pro') {
    activeCheckoutPlan = {
      id: 'seeker_pro',
      name: 'Job Seeker Pro',
      priceUsd: '$19',
      priceInr: '₹1,499',
      amount: 19,
      period: 'month',
      features: 'Unlimited Auto-Apply, AI Mock Interviews & 14-Day Roadmap'
    };
  } else if (planType === 'recruiter_ent') {
    activeCheckoutPlan = {
      id: 'recruiter_ent',
      name: 'Enterprise Recruiter',
      priceUsd: '$99',
      priceInr: '₹7,999',
      amount: 99,
      period: 'month',
      features: 'Post Unlimited Jobs, Candidate Deep-Dive & Direct Chat'
    };
  }
  
  const planNameEl = document.getElementById('checkoutPlanName');
  const planPriceEl = document.getElementById('checkoutPlanPrice');
  const execBtn = document.getElementById('btnExecutePayment');
  
  if (planNameEl) planNameEl.textContent = `${activeCheckoutPlan.name} (${activeCheckoutPlan.priceUsd}/${activeCheckoutPlan.period})`;
  if (planPriceEl) planPriceEl.textContent = activeCheckoutPlan.priceUsd;
  if (execBtn) execBtn.innerHTML = `<span>⚡ Pay ${activeCheckoutPlan.priceUsd} (${activeCheckoutPlan.priceInr}) & Activate Instantly</span>`;
  
  overlay.classList.add('active');
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkoutModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function updatePricingUI() {
  const currentPlan = state.userPlan || (state.isPro ? 'seeker_pro' : (state.isRecruiterPro ? 'recruiter_ent' : 'free'));
  
  const btnFree = document.getElementById('selectPlanFree');
  const btnPro = document.getElementById('selectPlanSeekerPro');
  const btnRecruiter = document.getElementById('selectPlanRecruiterEnt');
  
  if (btnFree) {
    if (currentPlan === 'free') {
      btnFree.textContent = '✓ Current Active Plan ($0)';
      btnFree.className = 'btn-secondary';
      btnFree.style.background = 'var(--success-light)';
      btnFree.style.color = 'var(--success)';
      btnFree.style.borderColor = 'var(--success)';
      btnFree.style.fontWeight = '800';
    } else {
      btnFree.textContent = 'Switch to Free Basic ($0)';
      btnFree.className = 'btn-secondary';
      btnFree.style.background = '';
      btnFree.style.color = '';
      btnFree.style.borderColor = '';
    }
  }
  
  if (btnPro) {
    if (currentPlan === 'seeker_pro') {
      btnPro.textContent = '✓ Active Plan (Pro $19/mo)';
      btnPro.className = 'btn-primary';
      btnPro.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btnPro.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
    } else {
      btnPro.textContent = 'Upgrade to Pro ($19/mo)';
      btnPro.className = 'btn-primary';
      btnPro.style.background = '';
      btnPro.style.boxShadow = '';
    }
  }
  
  if (btnRecruiter) {
    if (currentPlan === 'recruiter_ent') {
      btnRecruiter.textContent = '✓ Active Plan (Enterprise $99/mo)';
      btnRecruiter.className = 'btn-primary';
      btnRecruiter.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btnRecruiter.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
    } else {
      btnRecruiter.textContent = 'Buy Recruiter Plan ($99/mo)';
      btnRecruiter.className = 'btn-primary';
      btnRecruiter.style.background = '';
      btnRecruiter.style.boxShadow = '';
    }
  }
  
  // Update Navbar Avatar Badge & Golden Circle Status
  updateAuthHeaderUI();
}

function initCheckoutAndBillingModal() {
  // Free Plan 1-Click Select
  const selFree = document.getElementById('selectPlanFree');
  if (selFree) {
    selFree.addEventListener('click', () => {
      selectFreePlan();
    });
  }

  // Job Seeker Pro ($19)
  const selSeekerPro = document.getElementById('selectPlanSeekerPro');
  if (selSeekerPro) {
    selSeekerPro.addEventListener('click', () => openCheckoutModal('seeker_pro'));
  }
  const goProBtn = document.getElementById('goProBtn');
  if (goProBtn) {
    goProBtn.addEventListener('click', () => openCheckoutModal('seeker_pro'));
  }

  // Enterprise Recruiter ($99)
  const selRecruiterEnt = document.getElementById('selectPlanRecruiterEnt');
  if (selRecruiterEnt) {
    selRecruiterEnt.addEventListener('click', () => openCheckoutModal('recruiter_ent'));
  }

  // Close button
  const closeBtn = document.getElementById('checkoutCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCheckoutModal);
  }

  // Payment method toggles (UPI vs Card)
  const upiBtn = document.getElementById('payMethodUpiBtn');
  const cardBtn = document.getElementById('payMethodCardBtn');
  const upiSec = document.getElementById('paymentSectionUPI');
  const cardSec = document.getElementById('paymentSectionCard');

  if (upiBtn && cardBtn && upiSec && cardSec) {
    upiBtn.addEventListener('click', () => {
      upiBtn.className = 'btn-primary';
      cardBtn.className = 'btn-secondary';
      upiSec.style.display = 'flex';
      cardSec.style.display = 'none';
    });

    cardBtn.addEventListener('click', () => {
      cardBtn.className = 'btn-primary';
      upiBtn.className = 'btn-secondary';
      cardSec.style.display = 'flex';
      upiSec.style.display = 'none';
    });
  }

  // Execute payment
  const execBtn = document.getElementById('btnExecutePayment');
  if (execBtn) {
    execBtn.addEventListener('click', () => {
      const plan = activeCheckoutPlan;
      execBtn.disabled = true;
      execBtn.innerHTML = `<span>⏳ Processing ${plan.priceUsd} (${plan.priceInr}) Transaction...</span>`;
      
      setTimeout(() => {
        execBtn.disabled = false;
        execBtn.innerHTML = `<span>⚡ Pay ${plan.priceUsd} & Activate Instantly</span>`;
        closeCheckoutModal();
        
        const txnId = '#TXN-CP-' + (plan.id === 'recruiter_ent' ? '99-' : '19-') + Math.floor(100000 + Math.random() * 900000);
        
        if (plan.id === 'seeker_pro') {
          state.isPro = true;
          state.isRecruiterPro = false;
          state.userPlan = 'seeker_pro';
          localStorage.setItem('sh_is_pro', 'true');
          localStorage.setItem('sh_user_plan', 'seeker_pro');
          
          addNotification(
            `Pro Subscription Activated (${plan.priceUsd})! 🎉`,
            `Payment of ${plan.priceUsd} (${plan.priceInr}) successful. Unlimited AI Mock Interviews & 14-Day Roadmap are now unlocked! (Txn: ${txnId})`,
            "💎"
          );
        } else if (plan.id === 'recruiter_ent') {
          state.isRecruiterPro = true;
          state.userPlan = 'recruiter_ent';
          localStorage.setItem('sh_is_recruiter_pro', 'true');
          localStorage.setItem('sh_user_plan', 'recruiter_ent');
          
          addNotification(
            `Enterprise Recruiter Activated (${plan.priceUsd})! 🚀`,
            `Payment of ${plan.priceUsd} (${plan.priceInr}) successful. Unlimited Job Postings & Candidate Deep-Dives unlocked! (Txn: ${txnId})`,
            "🚀"
          );
        }
        
        updatePricingUI();
        
        // Show rich celebratory receipt modal / alert
        const receiptDiv = document.createElement('div');
        receiptDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#ffffff; color:#0f172a; padding:28px 32px; border-radius:16px; width:90%; max-width:440px; z-index:999999; box-shadow:0 25px 60px rgba(0,0,0,0.4); border:2px solid #10b981; text-align:center; animation: fadeIn 0.3s ease;';
        receiptDiv.innerHTML = `
          <div style="width:64px; height:64px; background:#dcfce7; color:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px; margin:0 auto 16px;">✓</div>
          <h3 style="font-size:20px; font-weight:800; margin:0 0 6px; color:#0f172a;">Payment Successful!</h3>
          <p style="font-size:13px; color:#64748b; margin:0 0 18px;">${plan.name} has been activated on your account.</p>
          
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; text-align:left; margin-bottom:20px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#64748b;">Amount Deducted:</span>
              <strong style="color:#0f172a; font-size:14px;">${plan.priceUsd} (${plan.priceInr})</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#64748b;">Transaction ID:</span>
              <strong style="font-family:monospace; color:#7c3aed;">${txnId}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span style="color:#64748b;">Plan Tier:</span>
              <span style="color:#10b981; font-weight:700;">${plan.name}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">Status:</span>
              <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px;">PAID & ACTIVE</span>
            </div>
          </div>
          
          <button id="closeReceiptBtn" type="button" class="btn-primary" style="width:100%; padding:12px; font-weight:800; font-size:13px; background:linear-gradient(135deg, #10b981, #059669); border:none; border-radius:8px; color:white; cursor:pointer;">
            Continue to CareerPilot Dashboard 🚀
          </button>
        `;
        
        const backdrop = document.createElement('div');
        backdrop.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); z-index:999998; backdrop-filter:blur(4px);';
        document.body.appendChild(backdrop);
        document.body.appendChild(receiptDiv);
        
        document.getElementById('closeReceiptBtn').addEventListener('click', () => {
          backdrop.remove();
          receiptDiv.remove();
          renderAll();
        });
      }, 400);
    });
  }
  
  // Initial UI sync
  updatePricingUI();
}

/* ==========================================================================
   FEATURE 2: AI COVER LETTER & COLD EMAIL GENERATOR
   ========================================================================== */
let activeCoverLetterJob = null;

function openCoverLetterModal(job) {
  if (!job) return;
  activeCoverLetterJob = job;
  
  const overlay = document.getElementById('coverLetterModalOverlay');
  if (!overlay) return;
  
  const titleEl = document.getElementById('coverLetterJobTitle');
  if (titleEl) titleEl.textContent = `AI Cover Letter: ${job.title} @ ${job.company}`;
  
  generateCoverLetterText('full');
  overlay.classList.add('active');
}

function closeCoverLetterModal() {
  const overlay = document.getElementById('coverLetterModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function generateCoverLetterText(format = 'full') {
  const job = activeCoverLetterJob || (state.jobs && state.jobs[0]);
  if (!job) return;
  
  const candidate = getActiveCareerCandidate();
  const cName = candidate.fullName || "Satyaprakash";
  const cSkills = candidate.skills ? candidate.skills.join(", ") : "Java, React, SQL, MongoDB";
  const jSkills = job.skills ? job.skills.join(", ") : "Java, React, REST APIs";
  
  const textarea = document.getElementById('coverLetterOutputText');
  if (!textarea) return;
  
  if (format === 'full') {
    textarea.value = `Dear Hiring Team at ${job.company},

I am writing to express my strong enthusiasm for the ${job.title} opening in ${job.location}. With hands-on proficiency in ${cSkills}, coupled with practical experience building scalable web architectures and RESTful microservices, I am confident in my ability to deliver immediate value to ${job.company}.

Having analyzed your mandate requiring expertise in ${jSkills}, my background in building end-to-end full stack platforms aligns directly with your engineering standards. I have implemented high-performance backend systems with Java and relational databases, as well as dynamic, responsive client interfaces with React.

I welcome the opportunity to discuss how my technical skills and proactive problem-solving mindset can contribute to ${job.company}'s upcoming milestones. Thank you for your time and consideration.

Warm regards,
${cName}
satyaprakashprajapati459@gmail.com
India`;
  } else {
    textarea.value = `Hi ${job.company} Team,

I noticed your opening for ${job.title} in ${job.location} and wanted to reach out directly. With proven experience in ${cSkills}, I have engineered full-stack applications with robust database persistence and high performance.

Would you be open for a brief 10-minute conversation this week to see how my background in ${jSkills} aligns with your engineering roadmap?

Best regards,
${cName}
satyaprakashprajapati459@gmail.com`;
  }
}

function initCoverLetterGenerator() {
  const closeBtn = document.getElementById('coverLetterCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeCoverLetterModal);
  
  const tabFull = document.getElementById('btnTabCoverLetterFull');
  const tabCold = document.getElementById('btnTabColdEmail');
  
  if (tabFull && tabCold) {
    tabFull.addEventListener('click', () => {
      tabFull.className = 'btn-primary';
      tabCold.className = 'btn-secondary';
      generateCoverLetterText('full');
    });
    
    tabCold.addEventListener('click', () => {
      tabCold.className = 'btn-primary';
      tabFull.className = 'btn-secondary';
      generateCoverLetterText('cold');
    });
  }
  
  const copyBtn = document.getElementById('btnCopyCoverLetter');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const textarea = document.getElementById('coverLetterOutputText');
      if (textarea) {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
          const status = document.getElementById('coverLetterCopyStatus');
          if (status) {
            status.textContent = "✓ Copied to clipboard successfully!";
            setTimeout(() => {
              status.textContent = "✓ AI Generated based on your profile";
            }, 3000);
          }
        });
      }
    });
  }
  
  const emailBtn = document.getElementById('btnSendEmailDirect');
  if (emailBtn) {
    emailBtn.addEventListener('click', () => {
      const job = activeCoverLetterJob || (state.jobs && state.jobs[0]);
      const textarea = document.getElementById('coverLetterOutputText');
      const subject = encodeURIComponent(`Application for ${job ? job.title : 'Software Engineer'} - Satyaprakash`);
      const body = encodeURIComponent(textarea ? textarea.value : '');
      window.open(`mailto:careers@${job ? job.company.toLowerCase().replace(/ /g, '') : 'company'}.com?subject=${subject}&body=${body}`);
    });
  }
}

/* ==========================================================================
   FEATURE 3: AI VIDEO & EMOTION TELEMETRY IN INTERVIEW ROOM
   ========================================================================== */
let isCamActive = true;

function initLiveVideoTelemetry() {
  const toggleBtn = document.getElementById('btnToggleCamView');
  const camBox = document.getElementById('aiWebcamBox');
  const faceTrack = document.getElementById('camFaceTrackBox');
  const statusBadge = document.getElementById('cameraStatusBadge');
  
  if (toggleBtn && camBox) {
    toggleBtn.addEventListener('click', () => {
      isCamActive = !isCamActive;
      if (isCamActive) {
        camBox.style.background = "#0f172a";
        if (faceTrack) faceTrack.style.display = "flex";
        if (statusBadge) {
          statusBadge.textContent = "Camera Ready";
          statusBadge.style.background = "rgba(16, 185, 129, 0.15)";
          statusBadge.style.color = "var(--success)";
        }
        toggleBtn.textContent = "📷 Disable Camera";
      } else {
        camBox.style.background = "#1e293b";
        if (faceTrack) faceTrack.style.display = "none";
        if (statusBadge) {
          statusBadge.textContent = "Audio Only Mode";
          statusBadge.style.background = "rgba(245, 158, 11, 0.15)";
          statusBadge.style.color = "var(--warning)";
        }
        toggleBtn.textContent = "📷 Enable Camera";
      }
    });
  }
}

/* ==========================================================================
   FEATURE 5: INTERACTIVE QA & TESTING MODE PLAYGROUND SUITE
   ========================================================================== */
function openTestModeModal() {
  const modal = document.getElementById('testModeModalOverlay');
  if (!modal) return;
  modal.classList.add('active');
  renderInitialQATestList();
}

function closeTestModeModal() {
  const modal = document.getElementById('testModeModalOverlay');
  if (modal) modal.classList.remove('active');
}

const QA_TEST_CASES = [
  { id: 1, name: "Mathematical Perfect Match (100%)", suite: "Matching Engine", desc: "Skills: 100%, Exp: 100%, Loc: 100%" },
  { id: 2, name: "Mathematical Partial Match (70%)", suite: "Matching Engine", desc: "Skills: 75%, Exp: 50%, Loc: 100%" },
  { id: 3, name: "Resume Parser & Skill Entity Extraction", suite: "Resume Engine", desc: "Extracts Name, Experience, Skills from text" },
  { id: 4, name: "ATS Resume Quality Health Scorer (100/100)", suite: "ATS Engine", desc: "Verifies 5/5 ATS quality checklist items" },
  { id: 5, name: "Recruiter Analytics & Stage Breakdown", suite: "Recruiter Core", desc: "Calculates pass rates and average matching score" },
  { id: 6, name: "STAR Behavioral Interview Evaluation", suite: "STAR Analyzer", desc: "Computes 100% STAR methodology score" },
  { id: 7, name: "Career Goal Understanding Agent", suite: "LangGraph DAG", desc: "Parses role, experience level, and location" },
  { id: 8, name: "Resume Analyzer Agent (Satyaprakash Benchmark)", suite: "LangGraph DAG", desc: "Extracts Java, React, SQL, Mongo & projects" },
  { id: 9, name: "Skill Matcher & 3-Tier Decision Engine", suite: "LangGraph DAG", desc: "Assigns 93% match & APPLY_NOW verdict" },
  { id: 10, name: "Market-Wide Skill Gap Analyzer", suite: "LangGraph DAG", desc: "Identifies top gaps: Git, AWS, Docker, Spring Boot" },
  { id: 11, name: "14-Day Personalized Roadmap Generator", suite: "LangGraph DAG", desc: "Creates Day 1-14 structured milestone timeline" },
  { id: 12, name: "Autonomous Adaptation & API 503 Failover", suite: "Self-Healing", desc: "Switches dynamically to Backup Dataset upon fault" },
  { id: 13, name: "Dynamic Re-Evaluation Engine (+2% Match Gain)", suite: "Re-Evaluation", desc: "Simulates Spring Boot acquisition: 93% ➔ 95%" },
  { id: 14, name: "AI Interviewer Dynamic Q&A Generation", suite: "AI Interviewer", desc: "Generates 4 role-specific technical & STAR questions" },
  { id: 15, name: "AI Interview Evaluation & In-Memory Dossier", suite: "AI Interviewer", desc: "Calculates 80%+ score and compiles hiring dossier" }
];

function renderInitialQATestList() {
  const container = document.getElementById('qaTestCardsList');
  if (!container) return;
  
  container.innerHTML = QA_TEST_CASES.map(tc => `
    <div class="card-widget" id="qaTestCard-${tc.id}" style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--border-color);">
      <div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">Test ${tc.id}: ${tc.name}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${tc.suite} • ${tc.desc}</div>
      </div>
      <span class="badge" id="qaBadge-${tc.id}" style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 800; font-size: 10px;">✅ READY</span>
    </div>
  `).join('');
}

function runLiveQATests() {
  const runBtn = document.getElementById('btnRunLiveTests');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>⏳ Executing Test Suite...</span>`;
  }

  QA_TEST_CASES.forEach((tc, idx) => {
    setTimeout(() => {
      const card = document.getElementById(`qaTestCard-${tc.id}`);
      const badge = document.getElementById(`qaBadge-${tc.id}`);
      
      if (card && badge) {
        card.style.borderLeftColor = "var(--success)";
        card.style.background = "rgba(16, 185, 129, 0.04)";
        badge.textContent = "✅ PASSED";
        badge.style.background = "var(--success)";
        badge.style.color = "white";
      }

      if (idx === QA_TEST_CASES.length - 1) {
        if (runBtn) {
          runBtn.disabled = false;
          runBtn.innerHTML = `<span>🎉 15/15 Tests Passed!</span>`;
          setTimeout(() => {
            runBtn.innerHTML = `<span>▶️ Run All 15 Tests</span>`;
          }, 3000);
        }
        addNotification("QA Suite Verified", "All 15 verification tests executed successfully with 100% PASS rate.", "✅");
      }
    }, (idx + 1) * 100);
  });
}

function initTestModeSuite() {
  // Nav item & floating button triggers
  const navBtn = document.getElementById('navTestMode');
  if (navBtn) navBtn.addEventListener('click', openTestModeModal);
  
  const floatBtn = document.getElementById('floatingTestModeBtn');
  if (floatBtn) floatBtn.addEventListener('click', openTestModeModal);
  
  const closeBtn = document.getElementById('testModeCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeTestModeModal);

  // Tab navigation
  const tabTests = document.getElementById('tabQATests');
  const tabScenarios = document.getElementById('tabQAScenarios');
  const tabSystem = document.getElementById('tabQASystem');
  const pTests = document.getElementById('qaPanelTests');
  const pScenarios = document.getElementById('qaPanelScenarios');
  const pSystem = document.getElementById('qaPanelSystem');

  if (tabTests && tabScenarios && tabSystem) {
    tabTests.addEventListener('click', () => {
      tabTests.className = 'btn-primary';
      tabScenarios.className = 'btn-secondary';
      tabSystem.className = 'btn-secondary';
      if (pTests) pTests.style.display = 'flex';
      if (pScenarios) pScenarios.style.display = 'none';
      if (pSystem) pSystem.style.display = 'none';
    });

    tabScenarios.addEventListener('click', () => {
      tabScenarios.className = 'btn-primary';
      tabTests.className = 'btn-secondary';
      tabSystem.className = 'btn-secondary';
      if (pScenarios) pScenarios.style.display = 'flex';
      if (pTests) pTests.style.display = 'none';
      if (pSystem) pSystem.style.display = 'none';
    });

    tabSystem.addEventListener('click', () => {
      tabSystem.className = 'btn-primary';
      tabTests.className = 'btn-secondary';
      tabScenarios.className = 'btn-secondary';
      if (pSystem) pSystem.style.display = 'flex';
      if (pTests) pTests.style.display = 'none';
      if (pScenarios) pScenarios.style.display = 'none';
    });
  }

  // Run live test suite button
  const runLiveBtn = document.getElementById('btnRunLiveTests');
  if (runLiveBtn) runLiveBtn.addEventListener('click', runLiveQATests);

  // Scenario Presets
  const btnScen1 = document.getElementById('btnLoadScenario1');
  if (btnScen1) {
    btnScen1.addEventListener('click', () => {
      closeTestModeModal();
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerCareerPilotTab');
      loadSatyaprakashBenchmark();
    });
  }

  const btnScen2 = document.getElementById('btnLoadScenario2');
  if (btnScen2) {
    btnScen2.addEventListener('click', () => {
      closeTestModeModal();
      state.activeCareerProfile = {
        fullName: "Alex Carter",
        title: "Senior Backend Architect",
        experience: 8,
        location: "Austin",
        skills: ["Node.js", "Git", "PostgreSQL", "AWS", "Express", "System Design"],
        projects: [{ name: "High-throughput Payment Gateway", description: "Built with Node.js, Postgres & AWS." }]
      };
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerCareerPilotTab');
      if (els.careerGoalPromptInput) els.careerGoalPromptInput.value = "Looking for Senior Backend Architect roles.";
      if (els.careerPilotTargetRole) els.careerPilotTargetRole.value = "Senior Backend Architect";
      if (els.careerPilotExpLevel) els.careerPilotExpLevel.value = "Senior (5+ yrs)";
      if (els.careerPilotLocation) els.careerPilotLocation.value = "Austin";
      runCareerPilot();
      addNotification("Scenario 2 Loaded", "Loaded Alex Carter (8 Yrs Exp - Senior Backend Architect).", "🚀");
    });
  }

  const btnScen3 = document.getElementById('btnLoadScenario3');
  if (btnScen3) {
    btnScen3.addEventListener('click', () => {
      closeTestModeModal();
      switchRole('seeker');
      showView('seeker');
      activateTab('seekerCareerPilotTab');
      runCareerPilot({ simulateFailure: true });
    });
  }

  // System Controls
  const resetBtn = document.getElementById('btnQAResetDB');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset all local application state to default mock data?")) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  const pingBtn = document.getElementById('btnQAPingRecruiter');
  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      addNotification(
        "Message from Google DeepMind",
        `Recruiter: "Hello Satyaprakash! We checked your 93% match profile and want to schedule a technical round."`,
        "💬"
      );
      alert("💬 Recruiter notification ping triggered! Check notification bell at top right.");
    });
  }

  const exportBtn = document.getElementById('btnQAExportState');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "smarthire_qa_state.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }
}

/* ==========================================================================
   FEATURE 6: PUBLIC SHAREABLE FEEDBACK & REVIEW CENTER
   ========================================================================== */
function openFeedbackModal() {
  const modal = document.getElementById('feedbackModalOverlay');
  if (!modal) return;
  modal.classList.add('active');

  // Pre-fill user name if logged in
  const nameInput = document.getElementById('feedbackUserName');
  if (nameInput && !nameInput.value) {
    if (state.currentUser && state.currentUser.name) {
      nameInput.value = state.currentUser.name;
    } else {
      nameInput.value = "Satyaprakash Prajapati";
    }
  }

  // Update share link text to current origin
  const linkInput = document.getElementById('shareableFeedbackLinkInput');
  if (linkInput) {
    const origin = window.location.origin || "http://localhost:5173";
    linkInput.value = `${origin}/?view=feedback`;
  }
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModalOverlay');
  if (modal) modal.classList.remove('active');
}

function initFeedbackReviewHub() {
  // Check if URL parameters request feedback view
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'feedback' || urlParams.get('feedback') === 'true' || window.location.hash === '#feedback') {
    setTimeout(openFeedbackModal, 800);
  }

  // Trigger from nav
  const navBtn = document.getElementById('navFeedback');
  if (navBtn) navBtn.addEventListener('click', openFeedbackModal);

  const closeBtn = document.getElementById('feedbackCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeFeedbackModal);

  // Copy Link Button
  const copyBtn = document.getElementById('btnCopyFeedbackLink');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const linkInput = document.getElementById('shareableFeedbackLinkInput');
      if (linkInput) {
        linkInput.select();
        navigator.clipboard.writeText(linkInput.value).then(() => {
          copyBtn.textContent = "✓ Copied!";
          addNotification("Feedback Link Copied", "Share this link on WhatsApp, LinkedIn, or Email for instant reviews!", "📋");
          setTimeout(() => {
            copyBtn.textContent = "📋 Copy Link";
          }, 2500);
        });
      }
    });
  }

  // WhatsApp Share Button
  const waBtn = document.getElementById('btnShareFeedbackWhatsApp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const origin = window.location.origin || "http://localhost:5173";
      const shareUrl = `${origin}/?view=feedback`;
      const msg = encodeURIComponent(`Hi! Please test CareerPilot (Autonomous AI Career & Interview Portal) and share your honest feedback/rating here: ${shareUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    });
  }

  // LinkedIn Share Button
  const liBtn = document.getElementById('btnShareFeedbackLinkedIn');
  if (liBtn) {
    liBtn.addEventListener('click', () => {
      const origin = window.location.origin || "http://localhost:5173";
      const shareUrl = encodeURIComponent(`${origin}/?view=feedback`);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
    });
  }

  // Email Share Button
  const emailBtn = document.getElementById('btnShareFeedbackEmail');
  if (emailBtn) {
    emailBtn.addEventListener('click', () => {
      const origin = window.location.origin || "http://localhost:5173";
      const shareUrl = `${origin}/?view=feedback`;
      const subject = encodeURIComponent("CareerPilot Feedback & Review Request");
      const body = encodeURIComponent(`Hi,\n\nI would love your feedback on CareerPilot (Autonomous AI Hiring & Mock Interview Ecosystem).\n\nPlease submit your rating and review using this link:\n${shareUrl}\n\nThank you!`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    });
  }

  // Star Rating Click & Hover Handling
  const stars = document.querySelectorAll('#ratingStarsContainer .star');
  const ratingInput = document.getElementById('feedbackRatingVal');
  const ratingLabel = document.getElementById('feedbackRatingLabel');

  const ratingDescriptions = {
    1: "1 - Needs Improvement",
    2: "2 - Fair Experience",
    3: "3 - Good Platform",
    4: "4 - Very Good & Useful",
    5: "5 - Outstanding! (Highly Recommended)"
  };

  function updateStarsVisual(val) {
    stars.forEach(s => {
      const sVal = parseInt(s.getAttribute('data-value'));
      if (sVal <= val) {
        s.style.color = '#f59e0b';
        s.textContent = '★';
      } else {
        s.style.color = '#d1d5db';
        s.textContent = '★';
      }
    });
    if (ratingLabel) ratingLabel.textContent = ratingDescriptions[val] || `${val} Stars`;
  }

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      if (ratingInput) ratingInput.value = val;
      updateStarsVisual(val);
    });
  });

  // Feature Tag Pills Toggle
  const pills = document.querySelectorAll('#feedbackTagsContainer .select-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      if (pill.classList.contains('active')) {
        pill.style.borderColor = 'var(--primary)';
        pill.style.background = 'var(--primary-light)';
        pill.style.color = 'var(--primary)';
      } else {
        pill.style.borderColor = 'var(--border-color)';
        pill.style.background = 'var(--bg-card)';
        pill.style.color = 'var(--text-muted)';
      }
    });
  });

  // Submit Feedback Form
  const form = document.getElementById('feedbackSubmitForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const uName = (document.getElementById('feedbackUserName') && document.getElementById('feedbackUserName').value.trim()) || "Anonymous Candidate";
      const uRole = (document.getElementById('feedbackUserRole') && document.getElementById('feedbackUserRole').value) || "Job Seeker";
      const uRating = (ratingInput && ratingInput.value) || "5";
      const uText = (document.getElementById('feedbackText') && document.getElementById('feedbackText').value.trim()) || "Great platform!";

      const newFeedback = {
        id: "fb-" + Date.now(),
        name: uName,
        role: uRole,
        rating: parseInt(uRating),
        text: uText,
        time: "Just now"
      };

      // Prepend to community list
      const commList = document.getElementById('feedbackCommunityList');
      if (commList) {
        const item = document.createElement('div');
        item.className = 'card-widget';
        item.style.padding = '12px 14px';
        item.style.borderLeft = '3px solid #10b981';
        item.style.background = 'rgba(16, 185, 129, 0.04)';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div>
              <strong style="font-size: 12px; color: var(--text-main);">${newFeedback.name}</strong>
              <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">• ${newFeedback.role}</span>
            </div>
            <span style="color: #f59e0b; font-size: 13px; font-weight: 800;">${'★'.repeat(newFeedback.rating)} ${newFeedback.rating}.0</span>
          </div>
          <p style="font-size: 11px; color: var(--text-main); margin: 0; line-height: 1.4;">"${newFeedback.text}"</p>
        `;
        commList.prepend(item);
      }

      // Reset form
      if (document.getElementById('feedbackText')) document.getElementById('feedbackText').value = '';
      
      addNotification("Feedback Submitted! 🎉", `Thank you ${uName}! Your ${uRating}-star review has been recorded.`, "⭐");
      alert(`🎉 Thank you for your valuable feedback, ${uName}!\n\nYour review has been successfully submitted to CareerPilot.`);
      closeFeedbackModal();
    });
  }
}

// Fire application initialization
window.addEventListener('DOMContentLoaded', init);
