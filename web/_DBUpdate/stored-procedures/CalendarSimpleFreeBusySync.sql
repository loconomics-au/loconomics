/****** Object:  StoredProcedure [dbo].[CalendarSimpleFreeBusySync]    Script Date: 07/01/2013 12:03:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[CalendarSimpleFreeBusySync]
	-- Add the parameters for the stored procedure here
	@vUserId  bigint,
	@vSerializedCollection varchar(5000)
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;


DECLARE @tempReturn AS INT
DECLARE @tempMsg AS VARCHAR(150)
DECLARE @WorkingInput AS VARCHAR(5000)
DECLARE @startpos AS INT
DECLARE @len AS INT 
DECLARE @CURROW AS VARCHAR(150)
DECLARE @IcsSrcName AS VARCHAR(150)
DECLARE @StartTime AS VARCHAR(150)
DECLARE @UID As INT 
DECLARE @TimeZone AS VARCHAR(150)
DECLARE @EndTime AS VARCHAR(150)
DECLARE @RecurringRules AS VARCHAR(150)
DECLARE @Longitude AS VARCHAR(150)
DECLARE @Latitude AS VARCHAR(150)
DECLARE @CrossStreets AS VARCHAR(150)





   SET @tempReturn = 0;
   SET @tempMsg = 'Processing Complete.';
  
  -- string format of input will be of the form
  /*
     {"FBC":[
                {"StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""},
                {"StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""},
                {"StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""}
            ]}
            
     this is a JSON string format
  */
  
  SET @WorkingInput = SUBSTRING(@vSerializedCollection, LEN('{"FBC":[') -1, @vSerializedCollection -4); -- (-4), -1 from length less last 3 characters
  SET @WorkingInput = REPLACE(@WorkingInput, '},{', '|');
  
  /*
     @WorkingInput format:
        "StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""|
        "StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""|
        "StartTime":"", "IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""
  */
  
  
  -- need some while loop structure here
  WHILE CHARINDEX('|',@WorkingInput) > 0
  BEGIN
   
    -- extract the first record
    SET @CURROW = SUBSTRING(@WorkingInput, 0,  CHARINDEX('|',@WorkingInput));
      /*
         @CURROW format:
            "StartTime":"","IcsSrcName":"","UID":"","TimeZone":"","EndTime":"","RecurringRules":"","Longitude":"","Latitude":"","CrossStreets":""
      */
    -- SUBSTR(source, start-pos, len) 
    SET @startpos = LEN('"StartTime":"')-1
    SET @len = PATINDEX('", "IcsSrcName',@CURROW)-LEN('"StartTime":"')
    SET @StartTime = SUBSTRING(@CURROW,@startpos, @len)
   
    SET @startpos = CHARINDEX('", "IcsSrcName',@CURROW) + LEN('IcsSrcName":"');
    SET @len = PATINDEX('", "UID',@CURROW) - PATINDEX('IcsSrcName":"',@CURROW);
    SET @IcsSrcName = SUBSTRING(@CURROW,@startpos, @len);
     
    SET @startpos =  PATINDEX('", "UID',@CURROW) + LEN('UID":"');
    SET @len = PATINDEX('", "TimeZone',@CURROW) - PATINDEX('UID":"',@CURROW);
    SET @UID = SUBSTRING(@CURROW,@startpos, @len);
   
    SET @startpos = PATINDEX('", "TimeZone',@CURROW)+ LEN('TimeZone":"');
    SET @len =  PATINDEX('", "EndTime',@CURROW) - PATINDEX('TimeZone":"',@CURROW);
    SET @TimeZone = SUBSTRING(@CURROW,@startpos, @len);
    
    SET @startpos =  PATINDEX('", "EndTime',@CURROW) + LEN('EndTime":"');
    SET @len =  PATINDEX('", "RecurringRules',@CURROW) - PATINDEX('EndTime":"',@CURROW);
    SET @EndTime = SUBSTRING(@CURROW,@startpos, @len);
     
    SET @startpos =  PATINDEX('", "RecurringRules',@CURROW) + LEN('RecurringRules":"');
    SET @len = PATINDEX('", "Longitude',@CURROW) - PATINDEX('RecurringRules":"',@CURROW);
    SET @RecurringRules = SUBSTRING(@CURROW,@startpos, @len);
   
    SET @startpos = PATINDEX('", "Longitude',@CURROW) + LEN('Longitude":"');
    SET @len =  PATINDEX('", "Latitude',@CURROW) - PATINDEX('Longitude":"',@CURROW);
    SET @Longitude = SUBSTRING(@CURROW,@startpos, @len);

    SET @startpos =  PATINDEX('", "Latitude',@CURROW) + LEN('Latitude":"');
    SET @len =  PATINDEX('", "CrossStreets',@CURROW) - PATINDEX('Latitude":"',@CURROW);
    SET @Latitude = SUBSTRING(@CURROW,@startpos, @len);
    
    SET @startpos =  PATINDEX('", "CrossStreets',@CURROW) + LEN('CrossStreets":"');
    SET @len = LEN(@CURROW) -1 -  PATINDEX('", "CrossStreets',@CURROW);
    SET @CrossStreets = SUBSTRING(@CURROW,@startpos, @len);
    
    EXEC CalendarSimpleFreeBusyCreate @vUserId
                                     ,@StartTime
                                     ,@IcsSrcName
                                     ,@UID
                                     ,@TimeZone
                                     ,@EndTime
                                     ,@RecurringRules
                                     ,@Longitude
                                     ,@Latitude
                                     ,@CrossStreets
      
    -- Move to the next record by resetting the contents of @workingInput to 
    -- the substring after the row just processed
    SET @WorkingInput = SUBSTRING(@WorkingInput,0,CHARINDEX('|',@WorkingInput) +1)
   
   END
   
END
