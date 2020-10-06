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

        public HelpSection()
        {
            //
            // TODO: Add constructor logic here
            //
        }

        public static IEnumerable<HelpSection> GetFullList(int languageID, int countryID)
        {
            var cached = HttpContext.Current.Cache["ClassCollection:HelpSection"] as List<HelpSection>;
            if (cached == null)
            {
                cached = new List<HelpSection>() { new HelpSection { category_id = 1234, description = "section desc", id = 1, locale = "en-AU", name = "section A" } };
                HttpContext.Current.Cache["ClassCollection:HelpSection"] = cached;
            }

            return cached;
        }
    }
}