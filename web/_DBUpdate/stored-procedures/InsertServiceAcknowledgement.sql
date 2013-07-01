/****** Object:  StoredProcedure [dbo].[InsertServiceAcknowledgement]    Script Date: 07/01/2013 12:04:46 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		
-- Create date: 
-- Description:	Create Service Request
-- =============================================
CREATE PROCEDURE [dbo].[InsertServiceAcknowledgement]
	-- Add the parameters for the stored procedure here
	
		@ServiceRequestID INT,
		@CalendarServiceStatusID INT,
		@UserID INT
		
-- EXEC 	dbo.InsertServiceAcknowledgement 1,2,2


AS

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;


    BEGIN TRANSACTION 
   
   INSERT INTO dbo.CalendarServiceAcknowledgement VALUES(@ServiceRequestID,@CalendarServiceStatusID,GETDATE(),@UserID)
   
    IF @@ERROR <> 0 
    BEGIN
	
		ROLLBACK  
		RAISERROR ('Error in inserting Calendar Service Request Acknowledgement.', 16, 1)
		RETURN
    
    END
    
    
    COMMIT  
 
    
