/**
 * OpportuBot UI Translations
 * Usage: t("key") returns the string in the active language
 */

export const TR = {
  en: {
    // Header
    appName:         "OpportuBot",
    adminPanel:      "Admin Panel",
    logout:          "Logout",

    // Stats
    total:           "Total",
    ready:           "Ready",
    applied:         "Applied",
    accepted:        "Accepted",
    rejected:        "Rejected",
    dueSoon:         "Due Soon",

    // Action cards
    findOpps:        "Find New Opportunities",
    freePlanNote:    "Free plan: up to 50 opportunities/month",
    proPlanNote:     "Unlimited opportunities — Pro plan active",
    runPipeline:     "Run Pipeline",
    pipelineRunning: "⏳ Pipeline running...",
    pipelineStarted: "Pipeline started! New opportunities will appear in a moment.",
    connectionError: "Connection error. Please try again.",

    updateCV:        "Update CV",
    uploadCV:        "Upload Your CV",
    cvOnFile:        "✓ on file",
    cvDesc:          "Upload a PDF — Claude AI extracts your profile for matching",
    upload:          "Upload",
    uploading:       "Uploading...",
    cvProgress:      "CV uploaded! AI analysis in progress (~30s)...",
    uploadFailed:    "Upload failed. Please try again.",

    upgradePro:      "Upgrade to Pro",
    upgradeDesc:     "Unlimited searches · AI scoring · Email notifications",
    upgradeBtn:      "Subscribe — IQD 9,990/mo",
    redirecting:     "Redirecting...",

    redeemGift:      "Redeem Gift Code",
    redeemDesc:      "Enter a gift code to unlock Pro features instantly",
    redeemBtn:       "Redeem",
    giftActivated:   "Gift activated! Expires: ",
    invalidCode:     "Invalid or expired code",

    // Opportunities list
    opportunities:   "Opportunities",
    noOppsYet:       "No opportunities yet",
    noOppsHint:      "Click \"Run Pipeline\" above to find your first opportunities",
    noResults:       "No results match your filters",
    noResultsHint:   "Try adjusting or resetting your filters",

    // Filters
    searchPlaceholder: "🔍 Search...",
    allTypes:        "All Types",
    jobs:            "Jobs",
    scholarships:    "Scholarships",
    internships:     "Internships",
    conferences:     "Conferences",
    trainings:       "Trainings",
    volunteerings:   "Volunteerings",
    allStatus:       "All Status",
    allCountries:    "🌍 All Countries",
    anyDeadline:     "📅 Any Deadline",
    dueThisWeek:     "Due This Week",
    dueThisMonth:    "Due This Month",
    overdue:         "Overdue",
    minScore:        "Min score:",
    resetFilters:    "✕ Reset",

    // Opp card
    viewOpp:         "View Opportunity →",
    coverLetterEN:   "✉️ Cover Letter (EN)",
    coverLetterAR:   "✉️ خطاب تقديم (AR)",
    interviewPrep:   "🎤 Interview Prep",

    // Cover letter modal
    clTitle:         "✉️ Cover Letter",
    copy:            "📋 Copy",
    close:           "✕ Close",
    clLoading:       "Claude AI is writing your cover letter...",
    clLoadingHint:   "This takes 5–10 seconds",
    english:         "English",
    arabic:          "عربي",

    // Interview prep modal
    ipTitle:         "🎤 Interview Prep",
    ipLoading:       "Claude AI is generating interview questions...",
    ipLoadingHint:   "This takes 10–15 seconds",
    answerTip:       "💡 ANSWER TIP",
  },

  ar: {
    // Header
    appName:         "أوبورتيوبوت",
    adminPanel:      "لوحة المشرف",
    logout:          "تسجيل الخروج",

    // Stats
    total:           "الإجمالي",
    ready:           "جاهزة",
    applied:         "تقدّمت",
    accepted:        "مقبولة",
    rejected:        "مرفوضة",
    dueSoon:         "تنتهي قريباً",

    // Action cards
    findOpps:        "ابحث عن فرص جديدة",
    freePlanNote:    "الباقة المجانية: حتى 50 فرصة / شهر",
    proPlanNote:     "فرص غير محدودة — الباقة الاحترافية مفعّلة",
    runPipeline:     "تشغيل البحث",
    pipelineRunning: "⏳ البحث جارٍ...",
    pipelineStarted: "بدأ البحث! ستظهر الفرص الجديدة بعد قليل.",
    connectionError: "خطأ في الاتصال. حاول مجدداً.",

    updateCV:        "تحديث السيرة الذاتية",
    uploadCV:        "رفع سيرتك الذاتية",
    cvOnFile:        "✓ موجودة",
    cvDesc:          "ارفع PDF — سيحلّلها Claude AI لمطابقة الفرص لك",
    upload:          "رفع",
    uploading:       "جارٍ الرفع...",
    cvProgress:      "تم الرفع! التحليل جارٍ (~30 ثانية)...",
    uploadFailed:    "فشل الرفع. حاول مجدداً.",

    upgradePro:      "ترقية إلى Pro",
    upgradeDesc:     "بحث غير محدود · تقييم AI · إشعارات بريدية",
    upgradeBtn:      "اشترك — 9,990 دينار/شهر",
    redirecting:     "جارٍ التحويل...",

    redeemGift:      "استرداد كود هدية",
    redeemDesc:      "أدخل كود الهدية لتفعيل ميزات Pro فوراً",
    redeemBtn:       "استرداد",
    giftActivated:   "فُعِّلت الهدية! تنتهي في: ",
    invalidCode:     "الكود غير صالح أو منتهي",

    // Opportunities list
    opportunities:   "الفرص",
    noOppsYet:       "لا توجد فرص بعد",
    noOppsHint:      "اضغط \"تشغيل البحث\" أعلاه للعثور على أول فرصة",
    noResults:       "لا توجد نتائج تطابق الفلاتر",
    noResultsHint:   "جرّب تعديل الفلاتر أو إعادة ضبطها",

    // Filters
    searchPlaceholder: "🔍 بحث...",
    allTypes:        "كل الأنواع",
    jobs:            "وظائف",
    scholarships:    "منح دراسية",
    internships:     "تدريب",
    conferences:     "مؤتمرات",
    trainings:       "دورات",
    volunteerings:   "تطوع",
    allStatus:       "كل الحالات",
    allCountries:    "🌍 كل الدول",
    anyDeadline:     "📅 أي موعد",
    dueThisWeek:     "ينتهي هذا الأسبوع",
    dueThisMonth:    "ينتهي هذا الشهر",
    overdue:         "منتهي الصلاحية",
    minScore:        "أدنى نقاط:",
    resetFilters:    "✕ إعادة ضبط",

    // Opp card
    viewOpp:         "عرض الفرصة →",
    coverLetterEN:   "✉️ Cover Letter (EN)",
    coverLetterAR:   "✉️ خطاب تقديم (AR)",
    interviewPrep:   "🎤 تحضير مقابلة",

    // Cover letter modal
    clTitle:         "✉️ خطاب التقديم",
    copy:            "📋 نسخ",
    close:           "✕ إغلاق",
    clLoading:       "Claude AI يكتب خطاب تقديمك...",
    clLoadingHint:   "يستغرق 5-10 ثوانٍ",
    english:         "English",
    arabic:          "عربي",

    // Interview prep modal
    ipTitle:         "🎤 تحضير المقابلة",
    ipLoading:       "Claude AI يولّد أسئلة المقابلة...",
    ipLoadingHint:   "يستغرق 10-15 ثانية",
    answerTip:       "💡 نصيحة للإجابة",
  },
}

export function makeTr(lang) {
  const dict = TR[lang] || TR.en
  return (key) => dict[key] ?? TR.en[key] ?? key
}
