

-- Add cycle_number field to truck_times table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND name = 'cycle_number')
BEGIN
    ALTER TABLE truck_times ADD cycle_number INT DEFAULT 1;
END
GO

PRINT 'Cycle number field has been added to truck_times table successfully!';