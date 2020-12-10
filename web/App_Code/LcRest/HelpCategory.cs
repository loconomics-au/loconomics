using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Summary description for HelpSection
    /// </summary>
    public class HelpCategory
    {
        #region fields
        public string description;
        public int id;
        public string locale;
        public string name;
        #endregion

        private readonly LcContent content;

        public HelpCategory()
        {
            content = new LcContent();
        }

        public IEnumerable<HelpCategory> GetFullList(int languageID, int countryID)
        {
            return content.GetHelpCategories();
        }
    }
}