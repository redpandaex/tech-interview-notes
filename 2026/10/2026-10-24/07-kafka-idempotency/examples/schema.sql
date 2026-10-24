CREATE TABLE processed_messages (
  message_id VARCHAR(64) PRIMARY KEY,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grading_task (
  task_id BIGINT PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  score DECIMAL(5,2) NULL
);

-- 方案二：条件状态更新；通过 affected rows 判断是否完成本次状态转换。
UPDATE grading_task
SET status = 'COMPLETED', score = 95
WHERE task_id = 1001 AND status = 'PENDING';
