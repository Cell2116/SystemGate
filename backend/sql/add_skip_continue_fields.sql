-- Add new fields for skip and continue functionality to trucks table
-- Run this migration script after the initial database setup

-- Add skipped_steps field to store comma-separated list of skipped steps  
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND name = 'skipped_steps')
BEGIN
    ALTER TABLE trucks ADD skipped_steps VARCHAR(255) NULL;
END
GO

-- Add skip_reason field to store reason for skipping steps
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND name = 'skip_reason')
BEGIN
    ALTER TABLE trucks ADD skip_reason VARCHAR(500) NULL;
END
GO

-- Add loading_cycle field to track multiple loading cycles
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND name = 'loading_cycle')
BEGIN
    ALTER TABLE trucks ADD loading_cycle INT DEFAULT 1;
END
GO

-- Add department_history field to track department changes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND name = 'department_history')
BEGIN
    ALTER TABLE trucks ADD department_history VARCHAR(255) NULL;
END
GO

-- Add PT-specific flow fields to separate PT from HPC flow
-- Add runtopt field to track when truck starts going to PT
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'runtopt')
BEGIN
    ALTER TABLE truck_times ADD runtopt TIME NULL;
END
GO

-- Add waitingforarrivalpt field to track waiting time for PT arrival
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'waitingforarrivalpt')
BEGIN
    ALTER TABLE truck_times ADD waitingforarrivalpt TIME NULL;
END
GO

-- Add entrypt field to track when truck enters PT
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'entrypt')
BEGIN
    ALTER TABLE truck_times ADD entrypt TIME NULL;
END
GO

PRINT 'Skip and Continue fields including PT flow fields have been added successfully!';