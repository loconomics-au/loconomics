CREATE TABLE dbo.SearchSubCategorySolution
(SearchSubCategoryID int NOT NULL,
SolutionID int NOT NULL,
LanguageID int NOT NULL,
CountryID int NOT NULL,
DisplayRank int,
CreatedDate datetimeoffset NOT NULL,
UpdatedDate datetimeoffset NOT NULL,
ModifiedBy nvarchar(4) DEFAULT 'sys' NOT NULL,
PRIMARY KEY (SearchSubCategoryID,SolutionID,LanguageID, CountryID));