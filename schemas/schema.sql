-- =============================================
-- FEEDBACK AGGREGATION TOOL - D1 DATABASE SCHEMA
-- =============================================

-- Drop existing tables (for development reset)
DROP TABLE IF EXISTS action_logs;
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS issue_feedback;
DROP TABLE IF EXISTS feedback_items;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS issue_groups;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS users;

-- =============================================
-- PROVIDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    config TEXT,
    last_sync_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'pm',
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- ISSUE GROUPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS issue_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    theme TEXT,
    issue_count INTEGER DEFAULT 0,
    feedback_count INTEGER DEFAULT 0,
    avg_severity REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- ISSUES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    category TEXT,
    subcategory TEXT,
    tags TEXT,
    base_severity REAL DEFAULT 0,
    current_severity REAL DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    sentiment TEXT,
    sentiment_score REAL,
    group_id TEXT REFERENCES issue_groups(id),
    feedback_count INTEGER DEFAULT 1,
    affected_users INTEGER DEFAULT 1,
    status TEXT DEFAULT 'new',
    resolution TEXT,
    assigned_to TEXT REFERENCES users(id),
    first_reported_at TEXT,
    last_feedback_at TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- FEEDBACK ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feedback_items (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES providers(id),
    external_id TEXT,
    source_url TEXT,
    author_id TEXT,
    author_name TEXT,
    author_email TEXT,
    author_avatar TEXT,
    title TEXT,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    processed INTEGER DEFAULT 0,
    summary TEXT,
    category TEXT,
    sentiment TEXT,
    sentiment_score REAL,
    keywords TEXT,
    metadata TEXT,
    source_created_at TEXT,
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- ISSUE-FEEDBACK JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS issue_feedback (
    issue_id TEXT NOT NULL REFERENCES issues(id),
    feedback_id TEXT NOT NULL REFERENCES feedback_items(id),
    similarity_score REAL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (issue_id, feedback_id)
);

-- =============================================
-- ACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id),
    type TEXT NOT NULL,
    payload TEXT,
    external_id TEXT,
    external_url TEXT,
    performed_by TEXT REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- =============================================
-- ACTION LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS action_logs (
    id TEXT PRIMARY KEY,
    action_id TEXT REFERENCES actions(id),
    issue_id TEXT REFERENCES issues(id),
    event_type TEXT NOT NULL,
    description TEXT,
    previous_value TEXT,
    new_value TEXT,
    performed_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_feedback_provider ON feedback_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON feedback_items(processed);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_items(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_items(created_at);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(current_severity DESC);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_group ON issues(group_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at);

CREATE INDEX IF NOT EXISTS idx_groups_status ON issue_groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_severity ON issue_groups(avg_severity DESC);

CREATE INDEX IF NOT EXISTS idx_actions_issue ON actions(issue_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(type);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);

CREATE INDEX IF NOT EXISTS idx_logs_issue ON action_logs(issue_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON action_logs(created_at);

-- =============================================
-- SEED DATA: DEFAULT PROVIDERS
-- =============================================
INSERT INTO providers (id, name, type, status) VALUES
    ('discord-main', 'Discord Community', 'discord', 'active'),
    ('slack-internal', 'Slack Internal', 'slack', 'active'),
    ('github-issues', 'GitHub Issues', 'github', 'active'),
    ('twitter-mentions', 'Twitter/X Mentions', 'twitter', 'active'),
    ('support-zendesk', 'Support Tickets', 'support', 'active');

-- =============================================
-- SEED DATA: SAMPLE USERS
-- =============================================
INSERT INTO users (id, email, name, role) VALUES
    ('user-pm-1', 'sarah.pm@company.com', 'Sarah Chen', 'pm'),
    ('user-pm-2', 'mike.pm@company.com', 'Mike Johnson', 'pm'),
    ('user-dev-1', 'alex.dev@company.com', 'Alex Rivera', 'developer'),
    ('user-admin', 'admin@company.com', 'Admin User', 'admin');
