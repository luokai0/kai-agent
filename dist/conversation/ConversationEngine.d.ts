/**
 * Conversation Engine - Kai Agent
 *
 * Advanced multi-modal conversation system supporting:
 * - Multiple conversation modes and styles
 * - Context tracking across turns
 * - Intent recognition and classification
 * - Emotional intelligence and sentiment
 * - Topic management and transitions
 * - Memory integration for long-term context
 * - Personality adaptation
 */
import { EventEmitter } from 'events';
import { MemoryBrain } from '../memory/MemoryBrain';
import { NeuralEngine } from '../neural/NeuralEngine';
export declare enum ConversationMode {
    TECHNICAL = "technical",
    FORMAL = "formal",
    ACADEMIC = "academic",
    CONSULTATIVE = "consultative",
    CASUAL = "casual",
    FRIENDLY = "friendly",
    PLAYFUL = "playful",
    HUMOROUS = "humorous",
    EDUCATIONAL = "educational",
    THERAPEUTIC = "therapeutic",
    CREATIVE = "creative",
    DEBATE = "debate",
    INTERVIEW = "interview",
    NEGOTIATION = "negotiation",
    COACHING = "coaching",
    STORYTELLING = "storytelling",
    CODING_HELPER = "coding_helper",
    SECURITY_ADVISOR = "security_advisor",
    DEBUGGER = "debugger",
    ARCHITECT = "architect",
    REVIEWER = "reviewer",
    META = "meta",
    REFLECTIVE = "reflective",
    PHILOSOPHICAL = "philosophical"
}
export declare enum ConversationStyle {
    CONCISE = "concise",
    DETAILED = "detailed",
    BALANCED = "balanced",
    VERBOSE = "verbose",
    POETIC = "poetic",
    TECHNICAL = "technical",
    SIMPLE = "simple",
    METAPHORICAL = "metaphorical"
}
export declare enum EmotionalTone {
    NEUTRAL = "neutral",
    EMPATHETIC = "empathetic",
    ENTHUSIASTIC = "enthusiastic",
    CALM = "calm",
    SERIOUS = "serious",
    PLAYFUL = "playful",
    SUPPORTIVE = "supportive",
    CRITICAL = "critical",
    CURIOUS = "curious",
    INSPIRATIONAL = "inspirational",
    FRIENDLY = "friendly",
    WARM = "warm"
}
export declare enum IntentCategory {
    QUESTION = "question",
    EXPLANATION = "explanation",
    CLARIFICATION = "clarification",
    FACT_CHECK = "fact_check",
    REQUEST = "request",
    COMMAND = "command",
    INSTRUCTION = "instruction",
    SUGGESTION = "suggestion",
    GREETING = "greeting",
    FAREWELL = "farewell",
    GRATITUDE = "gratitude",
    APOLOGY = "apology",
    COMPLIMENT = "compliment",
    OPINION = "opinion",
    FEEDBACK = "feedback",
    COMPLAINT = "complaint",
    PRAISE = "praise",
    COLLABORATION = "collaboration",
    BRAINSTORM = "brainstorm",
    DISCUSSION = "discussion",
    DEBATE = "debate",
    LEARNING = "learning",
    TEACHING = "teaching",
    PRACTICE = "practice",
    ASSESSMENT = "assessment",
    CREATION = "creation",
    IDEATION = "ideation",
    STORYTELLING = "storytelling",
    DESIGN = "design",
    TROUBLESHOOTING = "troubleshooting",
    DEBUGGING = "debugging",
    ANALYSIS = "analysis",
    SOLUTION = "solution"
}
export declare enum TopicCategory {
    TECHNOLOGY = "technology",
    PROGRAMMING = "programming",
    SECURITY = "security",
    SCIENCE = "science",
    MATHEMATICS = "mathematics",
    PHILOSOPHY = "philosophy",
    PSYCHOLOGY = "psychology",
    ART = "art",
    MUSIC = "music",
    LITERATURE = "literature",
    HISTORY = "history",
    POLITICS = "politics",
    ECONOMICS = "economics",
    BUSINESS = "business",
    HEALTH = "health",
    SPORTS = "sports",
    ENTERTAINMENT = "entertainment",
    TRAVEL = "travel",
    FOOD = "food",
    PERSONAL = "personal",
    RELATIONSHIPS = "relationships",
    CAREER = "career",
    EDUCATION = "education",
    ENVIRONMENT = "environment",
    ETHICS = "ethics",
    FUTURE = "future",
    META = "meta",
    GENERAL = "general"
}
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    intent: IntentClassification;
    sentiment: SentimentAnalysis;
    topics: TopicInfo[];
    entities: EntityInfo[];
    context: MessageContext;
    metadata: MessageMetadata;
}
export interface IntentClassification {
    primary: IntentCategory;
    secondary: IntentCategory[];
    confidence: number;
    subIntents: SubIntent[];
    actionRequired: boolean;
    urgencyLevel: UrgencyLevel;
}
export interface SubIntent {
    category: IntentCategory;
    description: string;
    confidence: number;
}
export declare enum UrgencyLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface SentimentAnalysis {
    overall: SentimentType;
    score: number;
    emotions: EmotionScore[];
    aspects: AspectSentiment[];
}
export declare enum SentimentType {
    VERY_NEGATIVE = "very_negative",
    NEGATIVE = "negative",
    SLIGHTLY_NEGATIVE = "slightly_negative",
    NEUTRAL = "neutral",
    SLIGHTLY_POSITIVE = "slightly_positive",
    POSITIVE = "positive",
    VERY_POSITIVE = "very_positive"
}
export interface EmotionScore {
    emotion: Emotion;
    score: number;
    indicators: string[];
}
export declare enum Emotion {
    JOY = "joy",
    SADNESS = "sadness",
    ANGER = "anger",
    FEAR = "fear",
    SURPRISE = "surprise",
    DISGUST = "disgust",
    TRUST = "trust",
    ANTICIPATION = "anticipation",
    LOVE = "love",
    REMORSE = "remorse",
    OPTIMISM = "optimism",
    PESSIMISM = "pessimism",
    CONTEMPT = "contempt",
    AGGRESSIVENESS = "aggressiveness",
    AWE = "awe",
    DISAPPROVAL = "disapproval",
    CURIOSITY = "curiosity",
    ANNOYANCE = "annoyance",
    EXCITEMENT = "excitement",
    CONFUSION = "confusion",
    FRUSTRATION = "frustration",
    HOPE = "hope",
    ANXIETY = "anxiety",
    CONFIDENCE = "confidence",
    SATISFACTION = "satisfaction",
    DISAPPOINTMENT = "disappointment",
    PRIDE = "pride",
    SHAME = "shame",
    GUILT = "guilt",
    GRATITUDE = "gratitude",
    ENVY = "envy",
    JEALOUSY = "jealousy",
    COMPASSION = "compassion",
    EMPATHY = "empathy",
    SYMPATHY = "sympathy",
    BOREDOM = "boredom",
    INTEREST = "interest"
}
export interface AspectSentiment {
    aspect: string;
    sentiment: SentimentType;
    score: number;
    keywords: string[];
}
export interface TopicInfo {
    category: TopicCategory;
    subTopic: string;
    keywords: string[];
    relevance: number;
    isNew: boolean;
    depth: TopicDepth;
}
export declare enum TopicDepth {
    SURFACE = "surface",
    MODERATE = "moderate",
    DEEP = "deep",
    EXPERT = "expert"
}
export interface EntityInfo {
    text: string;
    type: EntityType;
    confidence: number;
    metadata: Record<string, any>;
}
export declare enum EntityType {
    PERSON = "person",
    ORGANIZATION = "organization",
    LOCATION = "location",
    DATE = "date",
    TIME = "time",
    DURATION = "duration",
    MONEY = "money",
    PERCENTAGE = "percentage",
    QUANTITY = "quantity",
    ORDINAL = "ordinal",
    CARDINAL = "cardinal",
    PRODUCT = "product",
    EVENT = "event",
    WORK_OF_ART = "work_of_art",
    LAW = "law",
    LANGUAGE = "language",
    FAC = "facility",
    GPE = "gpe",// geopolitical entity
    NORP = "norp",// nationality, religious, political group
    TECHNOLOGY = "technology",
    CODE = "code",
    CONCEPT = "concept",
    METHOD = "method",
    ALGORITHM = "algorithm",
    FRAMEWORK = "framework",
    LIBRARY = "library",
    API = "api",
    FILE = "file",
    ERROR = "error",
    VARIABLE = "variable",
    FUNCTION = "function",
    CLASS = "class",
    MODULE = "module",
    PATTERN = "pattern",
    PRINCIPLE = "principle",
    BEST_PRACTICE = "best_practice",
    VULNERABILITY = "vulnerability",
    ATTACK = "attack",
    MITIGATION = "mitigation",
    TOOL = "tool",
    PLATFORM = "platform",
    PROTOCOL = "protocol",
    DATA_STRUCTURE = "data_structure",
    DATA_TYPE = "data_type",
    DATABASE = "database",
    SERVER = "server",
    CLIENT = "client",
    NETWORK = "network",
    SECURITY_CONCEPT = "security_concept"
}
export interface MessageContext {
    conversationId: string;
    turnNumber: number;
    referencesPrevious: boolean;
    referencedMessages: string[];
    continuationType: ContinuationType;
    discourseMarkers: string[];
    rhetoricalDevices: string[];
}
export declare enum ContinuationType {
    NEW_TOPIC = "new_topic",
    CONTINUATION = "continuation",
    ELABORATION = "elaboration",
    CLARIFICATION = "clarification",
    CHALLENGE = "challenge",
    AGREEMENT = "agreement",
    DISAGREEMENT = "disagreement",
    TRANSITION = "transition",
    SUMMARY = "summary",
    CONCLUSION = "conclusion",
    DIGRESSION = "digression",
    RETURN = "return"
}
export interface MessageMetadata {
    processingTime: number;
    tokensUsed: number;
    model: string;
    temperature: number;
    flags: MessageFlag[];
    quality: MessageQuality;
}
export declare enum MessageFlag {
    UNCERTAIN = "uncertain",
    REQUIRES_FOLLOWUP = "requires_followup",
    POTENTIALLY_HARMFUL = "potentially_harmful",
    CONTROVERSIAL = "controversial",
    SPECULATIVE = "speculative",
    FACTUAL = "factual",
    OPINIONATED = "opinionated",
    CREATIVE = "creative",
    HUMOROUS = "humorous",
    SARCASTIC = "sarcastic",
    IRONIC = "ironic",
    METAPHORICAL = "metaphorical"
}
export interface MessageQuality {
    coherence: number;
    relevance: number;
    informativeness: number;
    engagement: number;
    overall: number;
}
export interface ConversationSession {
    id: string;
    startTime: Date;
    lastActivity: Date;
    mode: ConversationMode;
    style: ConversationStyle;
    tone: EmotionalTone;
    messages: ConversationMessage[];
    context: SessionContext;
    participants: Participant[];
    state: ConversationState;
    analytics: ConversationAnalytics;
}
export interface SessionContext {
    topics: TopicHistory;
    entities: EntityMemory;
    intents: IntentHistory;
    sentiment: SentimentHistory;
    knowledge: KnowledgeContext;
    goals: ConversationGoal[];
    constraints: ConversationConstraint[];
    previousSessions: string[];
    preferences: ConversationPreferences;
}
export interface TopicHistory {
    current: TopicInfo[];
    discussed: TopicRecord[];
    transitions: TopicTransition[];
    depth: Map<TopicCategory, TopicDepth>;
}
export interface TopicRecord {
    topic: TopicInfo;
    firstMentioned: Date;
    lastMentioned: Date;
    mentionCount: number;
    sentiment: SentimentType;
    keyPoints: string[];
}
export interface TopicTransition {
    from: TopicInfo;
    to: TopicInfo;
    trigger: string;
    timestamp: Date;
    naturalness: number;
}
export interface EntityMemory {
    mentioned: Map<string, EntityRecord>;
    resolved: Map<string, string>;
    coreference: CoreferenceChain[];
}
export interface EntityRecord {
    entity: EntityInfo;
    firstMention: Date;
    lastMention: Date;
    mentionCount: number;
    attributes: Map<string, any>;
    sentiment: SentimentType;
    role: EntityRole;
}
export declare enum EntityRole {
    SUBJECT = "subject",
    OBJECT = "object",
    AGENT = "agent",
    PATIENT = "patient",
    THEME = "theme",
    EXPERIENCER = "experiencer",
    GOAL = "goal",
    SOURCE = "source",
    LOCATION = "location",
    TIME = "time",
    MANNER = "manner",
    CAUSE = "cause",
    PURPOSE = "purpose",
    INSTRUMENT = "instrument",
    BENEFICIARY = "beneficiary"
}
export interface CoreferenceChain {
    id: string;
    mentions: CoreferenceMention[];
    resolved: string;
    type: CoreferenceType;
}
export interface CoreferenceMention {
    messageId: string;
    text: string;
    startIndex: number;
    endIndex: number;
}
export declare enum CoreferenceType {
    PRONOUN = "pronoun",
    NOUN_PHRASE = "noun_phrase",
    DEMONSTRATIVE = "demonstrative",
    DEFINITE_DESCRIPTION = "definite_description",
    PROPER_NAME = "proper_name",
    BOUND_VARIABLE = "bound_variable",
    CATAPHORA = "cataphora",
    ELLIPSIS = "ellipsis"
}
export interface IntentHistory {
    sequence: IntentRecord[];
    patterns: IntentPattern[];
    pending: IntentCategory[];
    fulfilled: IntentCategory[];
}
export interface IntentRecord {
    intent: IntentClassification;
    messageId: string;
    timestamp: Date;
    followUp: string[];
    status: IntentStatus;
}
export declare enum IntentStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    FULFILLED = "fulfilled",
    PARTIALLY_FULFILLED = "partially_fulfilled",
    FAILED = "failed",
    CANCELLED = "cancelled",
    SUPERSEDED = "superseded"
}
export interface IntentPattern {
    pattern: IntentCategory[];
    frequency: number;
    outcomes: Map<string, number>;
    nextLikely: IntentCategory[];
}
export interface SentimentHistory {
    trajectory: SentimentPoint[];
    overallTrend: SentimentTrend;
    turningPoints: SentimentTurningPoint[];
    stability: number;
}
export interface SentimentPoint {
    timestamp: Date;
    sentiment: SentimentType;
    score: number;
    messageId: string;
}
export declare enum SentimentTrend {
    IMPROVING = "improving",
    DECLINING = "declining",
    STABLE = "stable",
    VOLATILE = "volatile",
    RECOVERING = "recovering"
}
export interface SentimentTurningPoint {
    timestamp: Date;
    from: SentimentType;
    to: SentimentType;
    trigger: string;
    messageId: string;
}
export interface KnowledgeContext {
    shared: Map<string, any>;
    assumed: Map<string, any>;
    clarified: Map<string, any>;
    contradictions: KnowledgeContradiction[];
    questions: OpenQuestion[];
}
export interface KnowledgeContradiction {
    statement1: string;
    statement2: string;
    messageId1: string;
    messageId2: string;
    resolved: boolean;
    resolution?: string;
}
export interface OpenQuestion {
    question: string;
    askedAt: Date;
    messageId: string;
    status: QuestionStatus;
    answer?: string;
}
export declare enum QuestionStatus {
    OPEN = "open",
    ANSWERED = "answered",
    WITHDRAWN = "withdrawn",
    REFORMULATED = "reformulated",
    IRRELEVANT = "irrelevant"
}
export interface ConversationGoal {
    id: string;
    description: string;
    type: GoalType;
    status: GoalStatus;
    progress: number;
    subGoals: ConversationGoal[];
    blockers: string[];
}
export declare enum GoalType {
    INFORMATION = "information",
    PROBLEM_SOLVING = "problem_solving",
    PERSUASION = "persuasion",
    RELATIONSHIP = "relationship",
    ENTERTAINMENT = "entertainment",
    LEARNING = "learning",
    TEACHING = "teaching",
    COLLABORATION = "collaboration",
    DECISION = "decision",
    NEGOTIATION = "negotiation"
}
export declare enum GoalStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    BLOCKED = "blocked",
    COMPLETED = "completed",
    FAILED = "failed",
    ABANDONED = "abandoned"
}
export interface ConversationConstraint {
    type: ConstraintType;
    description: string;
    priority: ConstraintPriority;
    active: boolean;
}
export declare enum ConstraintType {
    TIME = "time",
    SCOPE = "scope",
    TOPIC = "topic",
    TONE = "tone",
    PRIVACY = "privacy",
    ACCURACY = "accuracy",
    ETHICS = "ethics",
    LANGUAGE = "language",
    FORMALITY = "formality",
    TECHNICAL_LEVEL = "technical_level"
}
export declare enum ConstraintPriority {
    MANDATORY = "mandatory",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    PREFERENTIAL = "preferential"
}
export interface ConversationPreferences {
    responseLength: ResponseLengthPreference;
    detailLevel: DetailLevelPreference;
    formality: FormalityPreference;
    humor: HumorPreference;
    emotionalExpression: EmotionalExpressionPreference;
    personalization: PersonalizationLevel;
    explanationDepth: ExplanationDepthPreference;
    codeStyle: CodeStylePreference;
}
export declare enum ResponseLengthPreference {
    VERY_BRIEF = "very_brief",
    BRIEF = "brief",
    MODERATE = "moderate",
    DETAILED = "detailed",
    COMPREHENSIVE = "comprehensive"
}
export declare enum DetailLevelPreference {
    ESSENTIAL_ONLY = "essential_only",
    MODERATE = "moderate",
    HIGH = "high",
    EXHAUSTIVE = "exhaustive"
}
export declare enum FormalityPreference {
    VERY_INFORMAL = "very_informal",
    INFORMAL = "informal",
    NEUTRAL = "neutral",
    FORMAL = "formal",
    VERY_FORMAL = "very_formal"
}
export declare enum HumorPreference {
    NONE = "none",
    MINIMAL = "minimal",
    OCCASIONAL = "occasional",
    FREQUENT = "frequent",
    ABUNDANT = "abundant"
}
export declare enum EmotionalExpressionPreference {
    NEUTRAL = "neutral",
    SUBTLE = "subtle",
    MODERATE = "moderate",
    EXPRESSIVE = "expressive",
    VERY_EXPRESSIVE = "very_expressive"
}
export declare enum PersonalizationLevel {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    MAXIMUM = "maximum"
}
export declare enum ExplanationDepthPreference {
    NONE = "none",
    MINIMAL = "minimal",
    MODERATE = "moderate",
    DETAILED = "detailed",
    COMPREHENSIVE = "comprehensive"
}
export declare enum CodeStylePreference {
    CONCISE = "concise",
    VERBOSE = "verbose",
    DOCUMENTED = "documented",
    MINIMAL = "minimal",
    EDUCATIONAL = "educational"
}
export interface Participant {
    id: string;
    role: ParticipantRole;
    name: string;
    profile: ParticipantProfile;
    model: string;
}
export declare enum ParticipantRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
    OBSERVER = "observer",
    FACILITATOR = "facilitator"
}
export interface ParticipantProfile {
    expertise: Map<TopicCategory, ExpertiseLevel>;
    interests: TopicCategory[];
    communicationStyle: ConversationStyle;
    preferredTone: EmotionalTone;
    background: string[];
    goals: string[];
    constraints: string[];
}
export declare enum ExpertiseLevel {
    NOVICE = "novice",
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert",
    MASTER = "master",
    WORLD_CLASS = "world_class"
}
export interface ConversationState {
    phase: ConversationPhase;
    subPhase: string;
    turnNumber: number;
    isActive: boolean;
    needsResponse: boolean;
    pendingAction: string[];
    lastIntent: IntentCategory;
    lastTopic: TopicCategory;
    momentum: number;
    coherence: number;
    engagement: number;
}
export declare enum ConversationPhase {
    OPENING = "opening",
    EXPLORATION = "exploration",
    DEVELOPMENT = "development",
    CLARIFICATION = "clarification",
    CONVERGENCE = "convergence",
    CLOSING = "closing",
    TERMINATED = "terminated",
    PAUSED = "paused"
}
export interface ConversationAnalytics {
    totalMessages: number;
    messagesByRole: Map<string, number>;
    averageResponseTime: number;
    topicDistribution: Map<TopicCategory, number>;
    intentDistribution: Map<IntentCategory, number>;
    sentimentDistribution: Map<SentimentType, number>;
    entityFrequency: Map<string, number>;
    vocabularyDiversity: number;
    informationDensity: number;
    cohesionScore: number;
    turnTaking: TurnTakingMetrics;
}
export interface TurnTakingMetrics {
    averageTurnLength: number;
    turnLengthVariance: number;
    interruptions: number;
    overlaps: number;
    pauses: number;
    backchannels: number;
    symmetry: number;
}
export interface ResponsePlan {
    intent: ResponseIntent;
    content: ResponseContent;
    style: ResponseStyle;
    structure: ResponseStructure;
    timing: ResponseTiming;
    followUp: FollowUpPlan;
    alternatives: ResponseAlternative[];
}
export interface ResponseIntent {
    primaryGoal: ResponseGoal;
    secondaryGoals: ResponseGoal[];
    constraints: ResponseConstraint[];
    priority: ResponsePriority;
}
export declare enum ResponseGoal {
    INFORM = "inform",
    CLARIFY = "clarify",
    PERSUADE = "persuade",
    COMFORT = "comfort",
    ENTERTAIN = "entertain",
    GUIDE = "guide",
    CORRECT = "correct",
    ACKNOWLEDGE = "acknowledge",
    QUESTION = "question",
    SUGGEST = "suggest",
    CHALLENGE = "challenge",
    AGREE = "agree",
    DISAGREE = "disagree",
    ELABORATE = "elaborate",
    SUMMARIZE = "summarize",
    APOLOGIZE = "apologize",
    THANK = "thank",
    GREET = "greet",
    FAREWELL = "farewell",
    REDIRECT = "redirect",
    PROBE = "probe",
    CONFIRM = "confirm",
    DEFLECT = "deflect",
    HUMOR = "humor",
    INSPIRE = "inspire",
    MOTIVATE = "motivate",
    WARN = "warn",
    ADVISE = "advise",
    TEACH = "teach",
    LEARN = "learn"
}
export interface ResponseConstraint {
    type: string;
    value: any;
    strictness: ConstraintStrictness;
}
export declare enum ConstraintStrictness {
    REQUIRED = "required",
    PREFERRED = "preferred",
    OPTIONAL = "optional"
}
export declare enum ResponsePriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    DEFERRED = "deferred"
}
export interface ResponseContent {
    mainPoints: ContentPoint[];
    supportingPoints: ContentPoint[];
    examples: ContentExample[];
    references: ContentReference[];
    code: CodeContent[];
    warnings: string[];
    caveats: string[];
    nextSteps: string[];
}
export interface ContentPoint {
    text: string;
    importance: number;
    category: PointCategory;
    evidence: string[];
}
export declare enum PointCategory {
    FACT = "fact",
    OPINION = "opinion",
    INFERENCE = "inference",
    HYPOTHESIS = "hypothesis",
    RECOMMENDATION = "recommendation",
    OBSERVATION = "observation",
    QUESTION = "question",
    CLARIFICATION = "clarification",
    SUMMARY = "summary",
    METAPHOR = "metaphor",
    ANALOGY = "analogy",
    COMPARISON = "comparison",
    CONTRAST = "contrast",
    CAUSE = "cause",
    EFFECT = "effect",
    CONDITION = "condition",
    EXCEPTION = "exception"
}
export interface ContentExample {
    text: string;
    type: ExampleType;
    relevance: number;
    code?: string;
}
export declare enum ExampleType {
    ILLUSTRATIVE = "illustrative",
    COUNTEREXAMPLE = "counterexample",
    ANALOGY = "analogy",
    METAPHOR = "metaphor",
    CASE_STUDY = "case_study",
    SCENARIO = "scenario",
    HYPOTHETICAL = "hypothetical",
    REAL_WORLD = "real_world",
    CODE_SNIPPET = "code_snippet",
    COMMAND = "command",
    OUTPUT = "output",
    ERROR = "error",
    FIX = "fix"
}
export interface ContentReference {
    type: ReferenceType;
    text: string;
    url?: string;
    source?: string;
    credibility: number;
}
export declare enum ReferenceType {
    CITATION = "citation",
    LINK = "link",
    DOCUMENTATION = "documentation",
    RESEARCH_PAPER = "research_paper",
    BOOK = "book",
    ARTICLE = "article",
    TUTORIAL = "tutorial",
    GITHUB_REPO = "github_repo",
    STACK_OVERFLOW = "stack_overflow",
    DOCUMENTATION_SECTION = "documentation_section",
    RFC = "rfc",
    STANDARD = "standard",
    BEST_PRACTICE = "best_practice",
    PERSONAL_EXPERIENCE = "personal_experience",
    PREVIOUS_CONVERSATION = "previous_conversation",
    INTERNAL_KNOWLEDGE = "internal_knowledge"
}
export interface CodeContent {
    language: string;
    code: string;
    explanation: string;
    purpose: CodePurpose;
    execution: ExecutionInfo;
}
export declare enum CodePurpose {
    ILLUSTRATIVE = "illustrative",
    FUNCTIONAL = "functional",
    CORRECTIVE = "corrective",
    OPTIMIZED = "optimized",
    EDUCATIONAL = "educational",
    TEMPLATE = "template",
    SNIPPET = "snippet",
    COMPLETE_SOLUTION = "complete_solution",
    WORKAROUND = "workaround",
    ALTERNATIVE = "alternative",
    PROOF_OF_CONCEPT = "proof_of_concept",
    DEBUGGING = "debugging",
    TESTING = "testing",
    DOCUMENTATION = "documentation"
}
export interface ExecutionInfo {
    runnable: boolean;
    dependencies: string[];
    environment: string[];
    expectedOutput?: string;
    warnings: string[];
}
export interface ResponseStyle {
    tone: EmotionalTone;
    formality: FormalityPreference;
    length: ResponseLengthPreference;
    humor: HumorPreference;
    emotion: EmotionalExpressionPreference;
    personalization: PersonalizationLevel;
    voice: VoiceCharacteristics;
    rhetoric: RhetoricalDevices;
}
export interface VoiceCharacteristics {
    personality: PersonalityType[];
    warmth: number;
    competence: number;
    assertiveness: number;
    creativity: number;
    enthusiasm: number;
    patience: number;
    curiosity: number;
    humor: number;
    empathy: number;
}
export declare enum PersonalityType {
    ANALYST = "analyst",
    DIPLOMAT = "diplomat",
    SENTINEL = "sentinel",
    EXPLORER = "explorer",
    LOGICIAN = "logician",
    COMMANDER = "commander",
    DEBATER = "debater",
    ADVOCATE = "advocate",
    MEDIATOR = "mediator",
    PROTAGONIST = "protagonist",
    LOGISTICIAN = "logistician",
    EXECUTIVE = "executive",
    CONSUL = "consul",
    VIRTUOSO = "virtuoso",
    ENTREPRENEUR = "entrepreneur",
    ENTERTAINER = "entertainer",
    HELPER = "helper",
    ACHIEVER = "achiever",
    INDIVIDUALIST = "individualist",
    INVESTIGATOR = "investigator",
    LOYALIST = "loyalist",
    ENTHUSIAST = "enthusiast",
    CHALLENGER = "challenger",
    PEACEMAKER = "peacemaker",
    TEACHER = "teacher",
    COUNSELOR = "counselor",
    ARTIST = "artist",
    INTERVIEWER = "interviewer",
    COACH = "coach",
    STORYTELLER = "storyteller",
    DEVELOPER = "developer",
    GUARDIAN = "guardian",
    DETECTIVE = "detective",
    ARCHITECT = "architect",
    CRITIC = "critic",
    PHILOSOPHER = "philosopher",
    MEDITATOR = "meditator"
}
export interface RhetoricalDevices {
    metaphors: boolean;
    analogies: boolean;
    rhetorical: boolean;
    repetition: boolean;
    parallelism: boolean;
    alliteration: boolean;
    anecdotes: boolean;
    statistics: boolean;
    authority: boolean;
    pathos: boolean;
    logos: boolean;
    ethos: boolean;
    irony: boolean;
    hyperbole: boolean;
    understatement: boolean;
    personification: boolean;
    simile: boolean;
    symbolism: boolean;
}
export interface ResponseStructure {
    opening: OpeningStructure;
    body: BodyStructure;
    closing: ClosingStructure;
    formatting: FormattingOptions;
}
export interface OpeningStructure {
    type: OpeningType;
    content: string;
    hook: boolean;
    context: boolean;
}
export declare enum OpeningType {
    DIRECT = "direct",
    GREETING = "greeting",
    ACKNOWLEDGMENT = "acknowledgment",
    CONTEXT_SETTING = "context_setting",
    QUESTION = "question",
    STATEMENT = "statement",
    QUOTE = "quote",
    ANECDOTE = "anecdote",
    STATISTIC = "statistic",
    METAPHOR = "metaphor",
    HUMOROUS = "humorous",
    TRANSITIONAL = "transitional",
    SUMMARY = "summary"
}
export interface BodyStructure {
    sections: BodySection[];
    flow: LogicalFlow;
    transitions: Transition[];
}
export interface BodySection {
    id: string;
    type: SectionType;
    heading?: string;
    points: ContentPoint[];
    code?: CodeContent;
    examples?: ContentExample[];
    order: number;
}
export declare enum SectionType {
    EXPLANATION = "explanation",
    CODE = "code",
    EXAMPLE = "example",
    ANALYSIS = "analysis",
    COMPARISON = "comparison",
    RECOMMENDATION = "recommendation",
    WARNING = "warning",
    DISCUSSION = "discussion",
    PROCEDURE = "procedure",
    LIST = "list",
    TABLE = "table",
    DIAGRAM = "diagram"
}
export interface LogicalFlow {
    primary: FlowPattern;
    secondary: FlowPattern[];
    connectors: string[];
}
export declare enum FlowPattern {
    CHRONOLOGICAL = "chronological",
    SEQUENTIAL = "sequential",
    PROBLEM_SOLUTION = "problem_solution",
    CAUSE_EFFECT = "cause_effect",
    COMPARISON = "comparison",
    GENERAL_SPECIFIC = "general_specific",
    SPECIFIC_GENERAL = "specific_general",
    QUESTION_ANSWER = "question_answer",
    TOPICAL = "topical",
    SPATIAL = "spatial",
    ORDER_OF_IMPORTANCE = "order_of_importance",
    INDUCTIVE = "inductive",
    DEDUCTIVE = "deductive",
    dialectical = "dialectical"
}
export interface Transition {
    type: TransitionType;
    text: string;
    fromSection: string;
    toSection: string;
}
export declare enum TransitionType {
    ADDITION = "addition",
    CONTRAST = "contrast",
    CAUSATION = "causation",
    CLARIFICATION = "clarification",
    EXEMPLIFICATION = "exemplification",
    SUMMARY = "summary",
    TIME = "time",
    LOCATION = "location",
    CONCESSION = "concession",
    RESULT = "result",
    PURPOSE = "purpose",
    CONDITION = "condition",
    RESUMPTION = "resumption",
    DIGRESSION = "digression"
}
export interface ClosingStructure {
    type: ClosingType;
    content: string;
    callToAction: string[];
    followUp: boolean;
    question: boolean;
}
export declare enum ClosingType {
    SUMMARY = "summary",
    CONCLUSION = "conclusion",
    RECOMMENDATION = "recommendation",
    QUESTION = "question",
    FAREWELL = "farewell",
    OPEN_ENDED = "open_ended",
    ACTION = "action",
    REFLECTION = "reflection",
    HOOK = "hook",
    CALL_TO_ACTION = "call_to_action",
    THANK_YOU = "thank_you",
    APOLOGY = "apology"
}
export interface FormattingOptions {
    markdown: boolean;
    codeBlocks: boolean;
    headings: boolean;
    lists: boolean;
    tables: boolean;
    emphasis: EmphasisOptions;
    whitespace: WhitespaceOptions;
}
export interface EmphasisOptions {
    bold: boolean;
    italic: boolean;
    code: boolean;
    links: boolean;
}
export interface WhitespaceOptions {
    paragraphBreaks: number;
    sectionBreaks: number;
    listSpacing: number;
}
export interface ResponseTiming {
    delay: number;
    pacing: ResponsePacing;
    pauses: PausePlacement[];
}
export declare enum ResponsePacing {
    RAPID = "rapid",
    NORMAL = "normal",
    DELIBERATE = "deliberate",
    SLOW = "slow"
}
export interface PausePlacement {
    position: number;
    duration: number;
    type: PauseType;
}
export declare enum PauseType {
    EMPHASIS = "emphasis",
    TRANSITION = "transition",
    DRAMATIC = "dramatic",
    PROCESSING = "processing",
    HESITATION = "hesitation"
}
export interface FollowUpPlan {
    questions: FollowUpQuestion[];
    suggestions: string[];
    actions: FollowUpAction[];
    continuation: ContinuationOption[];
}
export interface FollowUpQuestion {
    text: string;
    type: QuestionType;
    purpose: QuestionPurpose;
    timing: QuestionTiming;
}
export declare enum QuestionType {
    OPEN = "open",
    CLOSED = "closed",
    LEADING = "leading",
    PROBING = "probing",
    CLARIFYING = "clarifying",
    REFLECTIVE = "reflective",
    HYPOTHETICAL = "hypothetical",
    RHETORICAL = "rhetorical",
    FUNNEL = "funnel",
    MULTIPLE_CHOICE = "multiple_choice",
    SCALE = "scale",
    BOOLEAN = "boolean"
}
export declare enum QuestionPurpose {
    GATHER_INFO = "gather_info",
    CLARIFY = "clarify",
    CONFIRM = "confirm",
    EXPLORE = "explore",
    CHALLENGE = "challenge",
    ENGAGE = "engage",
    GUIDE = "guide",
    VERIFY = "verify",
    ASSESS = "assess"
}
export declare enum QuestionTiming {
    IMMEDIATE = "immediate",
    END_OF_RESPONSE = "end_of_response",
    LATER = "later",
    OPTIONAL = "optional"
}
export interface FollowUpAction {
    description: string;
    type: ActionType;
    trigger: string;
    priority: ActionPriority;
}
export declare enum ActionType {
    EXECUTE = "execute",
    RESEARCH = "research",
    VERIFY = "verify",
    MONITOR = "monitor",
    SCHEDULE = "schedule",
    NOTIFY = "notify",
    LOG = "log",
    LEARN = "learn"
}
export declare enum ActionPriority {
    IMMEDIATE = "immediate",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    OPTIONAL = "optional"
}
export interface ContinuationOption {
    topic: TopicCategory;
    direction: string;
    interest: number;
    relevance: number;
}
export interface ResponseAlternative {
    id: string;
    plan: ResponsePlan;
    scenario: string;
    condition: string;
}
export declare class ConversationEngine extends EventEmitter {
    private memoryBrain;
    private neuralEngine;
    private sessions;
    private currentSession;
    private conversationPatterns;
    private styleAdapters;
    private topicKnowledge;
    private emotionalEngine;
    private discourseEngine;
    private responseGenerator;
    private modeHandlers;
    private stats;
    constructor(memoryBrain: MemoryBrain, neuralEngine: NeuralEngine);
    private initializeModeHandlers;
    startSession(options?: SessionOptions): Promise<ConversationSession>;
    private generateSessionId;
    private initializeContext;
    private getDefaultPreferences;
    private getDefaultParticipant;
    private initializeState;
    private initializeAnalytics;
    endSession(sessionId?: string): Promise<void>;
    private generateSessionSummary;
    processMessage(content: string, options?: MessageOptions): Promise<ConversationMessage>;
    private generateMessageId;
    private classifyIntent;
    private extractIntentFeatures;
    private hasQuestionWords;
    private hasImperativeVerbs;
    private hasPolitenessMarkers;
    private hasGreetingWords;
    private hasFarewellWords;
    private hasGratitudeWords;
    private hasApologyWords;
    private hasOpinionMarkers;
    private hasRequestPatterns;
    private hasCodeIndicators;
    private matchIntentPatterns;
    private combineIntentClassification;
    private findSecondaryIntents;
    private findSubIntents;
    private requiresAction;
    private determineUrgency;
    private analyzeSentiment;
    private detectEmotions;
    private calculateOverallSentiment;
    private calculateSentimentScore;
    private analyzeAspectSentiment;
    private analyzeLocalSentiment;
    private extractTopics;
    private extractKeywords;
    private mapKeywordToCategory;
    private extractEntities;
    private extractCodeEntities;
    private extractNamedEntities;
    private isCommonWord;
    private extractTemporalEntities;
    private extractNumericEntities;
    private analyzeContext;
    private detectReferenceToPrevious;
    private findReferencedMessages;
    private messagesAreRelated;
    private determineContinuationType;
    private extractDiscourseMarkers;
    private detectRhetoricalDevices;
    private createMessageMetadata;
    private updateSessionContext;
    private updateTopicHistory;
    private calculateTransitionNaturalness;
    private updateEntityMemory;
    private updateIntentHistory;
    private updateSentimentHistory;
    private updateKnowledgeContext;
    private extractStatements;
    private statementToKey;
    private updateState;
    private calculateEngagement;
    private calculateCoherence;
    private updateAnalytics;
    private storeMessageInMemory;
    private calculateMessageImportance;
    generateResponse(options?: ResponseOptions): Promise<ConversationMessage>;
    private planResponse;
    private getDefaultResponsePlan;
    private determineResponseIntent;
    private intentToPriority;
    private determineResponseStyle;
    private determineResponseStructure;
    private determineResponseContent;
    private mapToPointCategory;
    private generateCodeSnippet;
    private detectLanguage;
    private generateNextSteps;
    private determineFollowUp;
    private generateResponseContent;
    private getDefaultVoiceCharacteristics;
    private getDefaultRhetoricalDevices;
    switchMode(mode: ConversationMode, sessionId?: string): Promise<void>;
    setTone(tone: EmotionalTone, sessionId?: string): void;
    setStyle(style: ConversationStyle, sessionId?: string): void;
    getSession(sessionId?: string): ConversationSession | null;
    getAllSessions(): ConversationSession[];
    getStats(): ConversationStats;
    chat(message: string, options?: ChatOptions): Promise<string>;
    chatWithMode(message: string, mode: ConversationMode): Promise<string>;
    codeChat(message: string): Promise<string>;
    securityChat(message: string): Promise<string>;
    debugChat(message: string): Promise<string>;
    learnChat(message: string): Promise<string>;
    creativeChat(message: string): Promise<string>;
    debateChat(message: string): Promise<string>;
    coachingChat(message: string): Promise<string>;
    storyChat(message: string): Promise<string>;
}
declare class ConversationStats {
    totalSessions: number;
    totalMessages: number;
    averageSessionLength: number;
    modeUsage: Map<ConversationMode, number>;
}
export interface SessionOptions {
    mode?: ConversationMode;
    style?: ConversationStyle;
    tone?: EmotionalTone;
    participants?: Participant[];
    goals?: ConversationGoal[];
    constraints?: ConversationConstraint[];
    preferences?: ConversationPreferences;
}
export interface MessageOptions {
    sessionId?: string;
    role?: 'user' | 'assistant' | 'system';
}
export interface ResponseOptions {
    sessionId?: string;
}
export interface ChatOptions {
    sessionId?: string;
    mode?: ConversationMode;
    tone?: EmotionalTone;
}
export default ConversationEngine;
//# sourceMappingURL=ConversationEngine.d.ts.map