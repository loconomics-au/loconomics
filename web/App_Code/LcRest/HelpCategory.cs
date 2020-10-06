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
        public HelpCategory()
        {
            //
            // TODO: Add constructor logic here
            //
        }

        public static IEnumerable<HelpCategory> GetFullList(int languageID, int countryID)
        {
            var cached = HttpContext.Current.Cache["ClassCollection:HelpCategory"] as List<HelpCategory>;
            if (cached == null)
            {
                cached = new List<HelpCategory>() { new HelpCategory { description = "cat desc", id = 1234, locale = "en-AU", name = "cat A" } };
                HttpContext.Current.Cache["ClassCollection:HelpSection"] = cached;
            }

            return cached;
        }
    }
}