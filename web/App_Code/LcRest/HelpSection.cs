using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Summary description for HelpSection
    /// </summary>
    public class HelpSection
    {
        #region fields
        public int category_id;
        public string description;
        public int id;
        public string locale;
        public string name;
        #endregion

        private readonly LcContent content;

        public HelpSection()
        {
            content = new LcContent();
        }

        public IEnumerable<HelpSection> GetFullList(int languageID, int countryID)
        {
            return content.GetHelpSections().ToList();
        }
    }
}