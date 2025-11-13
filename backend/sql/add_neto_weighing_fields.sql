USE thirdparty;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'starttimbangneto')

BEGIN
    ALTER TABLE truck_times ADD starttimbangneto TIME;
    PRINT 'Added starttimbangneto column to truck_times table';
END
ELSE
BEGIN
    PRINT 'starttimbangneto column already exists in truck_times table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'finishtimbangneto')
BEGIN
    ALTER TABLE truck_times ADD finishtimbangneto TIME;
    PRINT 'Added finishtimbangneto column to truck_times table';
END
ELSE
BEGIN
    PRINT 'finishtimbangneto column already exists in truck_times table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'waitingfortimbangneto')
BEGIN
    ALTER TABLE truck_times ADD waitingfortimbangneto TIME;
    PRINT 'Added waitingfortimbangneto column to truck_times table';
END
ELSE
BEGIN
    PRINT 'waitingfortimbangneto column already exists in truck_times table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'totalprocesstimbangneto')
BEGIN
    ALTER TABLE truck_times ADD totalprocesstimbangneto TIME;
    PRINT 'Added totalprocesstimbangneto column to truck_times table';
END
ELSE
BEGIN
    PRINT 'totalprocesstimbangneto column already exists in truck_times table';
END
GO

PRINT 'Neto weighing fields migration completed successfully!';