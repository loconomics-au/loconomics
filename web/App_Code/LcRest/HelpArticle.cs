using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Summary description for HelpArticle
    /// </summary>
    public class HelpArticle
    {
        #region fields
        public int author_id;
        public bool draft;
        public int id;
        public string locale;
        public int permission_group_id;
        public string title;
        public string body;
        public int section_id;
        public int user_segment_id;

        #endregion
        public HelpArticle()
        {
            //
            // TODO: Add constructor logic here
            //
        }

        public static IEnumerable<HelpArticle> GetFullList(int languageID, int countryID)
        {
            var cached = HttpContext.Current.Cache["ClassCollection:HelpArticle"] as List<HelpArticle>;
            if (cached == null)
            {
                cached = new List<HelpArticle>() { new HelpArticle { id = 1, user_segment_id = 123, title = "test title", body = "test body", section_id = 1 } };
                HttpContext.Current.Cache["ClassCollection:HelpArticle"] = cached;
            }

            return cached;
        }
    }
}