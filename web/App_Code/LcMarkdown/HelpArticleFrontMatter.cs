using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using YamlDotNet.Serialization;

namespace LcMarkdown
{
    /// <summary>
    /// Summary description for HelpArticleFrontMatter
    /// </summary>
    public class HelpArticleFrontMatter
	{
        #region Fields
        [YamlMember(Alias = "id")]
        public int Id { get; set; }

        [YamlMember(Alias = "title")]
        public string Title { get; set; }

        [YamlMember(Alias = "category")]
        public string Category { get; set; }

        [YamlMember(Alias = "section")]
        public string Section { get; set; }

        [YamlMember(Alias = "section_id")]
        public int SectionId { get; set; }

        public string Content { get; set; }

        #endregion
    }
}