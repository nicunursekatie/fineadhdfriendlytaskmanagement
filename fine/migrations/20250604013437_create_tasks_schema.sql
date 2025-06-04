-- Create tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  energyLevel INTEGER NOT NULL,
  emotionalImportance INTEGER NOT NULL,
  estimatedTime INTEGER,
  actualTime INTEGER,
  context TEXT NOT NULL,
  status TEXT NOT NULL,
  dueDate TEXT,
  createdAt TEXT NOT NULL,
  completedAt TEXT,
  userId TEXT NOT NULL
);

-- Create task breakdown table
CREATE TABLE taskBreakdowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER NOT NULL,
  stepTitle TEXT NOT NULL,
  stepDescription TEXT,
  isCompleted BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create brain dumps table
CREATE TABLE brainDumps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  userId TEXT NOT NULL
);

-- Create achievements table
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  userId TEXT NOT NULL
);

-- Create streaks table
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count INTEGER NOT NULL DEFAULT 0,
  lastCompletedAt TEXT NOT NULL,
  userId TEXT NOT NULL
);