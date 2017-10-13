# Backup Azure Database

Our hosting, Azure, performs some automatic backups of the databases that can be restored as a new hosted database. But at this document we cover when an offline (or local) database backup is wanted, for proposals like backup database inmediately before apply upgrade scripts, or to create a local database based on *dev* database to start backend development.

There are several approaches to get a copy of an Azure Database, as [can be found here](http://stackoverflow.com/questions/5475306/how-do-i-copy-sql-azure-database-to-my-local-development-server#5481143).

Next steps describe the SSIS method from the link, also know as using "Microsoft SQL Server Management Studio" (SSMS), with extra details for problems we found.

- Open SSMS as administrator.
- Create local empty database, SQL 2008 or newer, strictly with collation *SQL_Latin1_General_CP1_CI_AS* (see Note 1).
- Right-click database -> Tasks -> Import data.
- For source, choose ".Net Provider for SQL Server" and set the Azure connection string to the hosted database. This includes the following fields: 
  - Authentication: SqlPassword
  - Password 
  - User ID
  - Data Source
  - Initial Catalog: Dev
- For destination, choose "SQL Server Native Client 11" and choose the local server and our empty database.
- Continue the process, choose all "dbo." objects (usually all excluding one starting by "sys." and the views, "dbo.vw*"), do not edit mappings.
- Finish the process.
- Next, you must migrate the views and stored functions from Dev to your new local loconomics database:
  - In SSMS, Connect to Dev database
  - In object explorer, under Dev database, click on Programmability -> Functions -> Scalar-valued Functions
  - In the menu, click on View -> Object Explorer Details
  - Highlight all of the functions in the details window, and right click
  - Choose Script Function as -> CREATE To -> Clipboard
  - Paste this query in a new loconomics database query
  - At the top of the file, change `USE [Dev]` to `USE [loconomics]`
  - Execute the query
  - _(repeat this process for the views: Dev -> Views)_
  
- Creating Identites
  - Identíties need to be created manually in SSMS as the identity cannot be added to an existing column with data via a script. Thankfully we can run a script that lets us know which tables have identities. [1. creatingidenties.sql](../web/_DBUpdate/install/1. creatingidentities.sql). Make sure you can create table identities on your database by un checking Tools>Options>Designers>'Prevent saving changes that require table re-creation'.
  - for each of those tables, make sure the ID column is an identity in the table designer.
- Creating Constraints
  - We can create the constraints with a scipt by using [2. creatingconstraints.sql](../web/_DBUpdate/install/2. creatingconstraints.sql). This script will create a series of ALTER TABLE statements that can be run against your local database.
- Creating foreign keys
  - We can create the foreign keys with a script by using [3. creatingforeignkeys.sql](../web/_DBUpdate/install/3. creatingforeignkeys.sql). This script will print the neccessary ALTER TABLE commands that can be run against your local database.
- Creating primary keys
  - We can create the primary keys with a script by using [4. creatingprimarykeys.sql](../web/_DBUpdate/install/4. creatingprimarykeys.sql). This script will print the neccessary ALTER TABLE commands that can be run against your local database.


**Note 1:** a database created with a different collation than the source will lead to warnings about conversions between varchar columns (different size required for same data), and potentially an error in the process. The indicated collation is the default at Azure DB, but in case was manually changed check it running "SELECT DATABASEPROPERTYEX('TestDB', 'Collation')" (change TestDB by the database name).

**Note 2:** if any error appear, review the log messages clicking the link provided by SSMS and go to the last lines (more of the lines are just informative of successful sub-tasks). A well know error is one that happened with varchar/nvarchar columns that have a size bigger than 4000, that is the limit; on that cases, keep the window open, open an issue to request change the size of that columns to 4000 (since bigger of that makes no sense, is a mistake), then go back in process at the import window, edit the mappings changing the affected column to a size of 4000, re-create local database (process will fail if some data was already copied), and continue the process.
