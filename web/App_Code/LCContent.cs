using LcMarkdown;
using LcRest;
using Markdig;
using Markdig.Renderers;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for LcContent
/// </summary>
public class LcContent
{
    public string pagesOwnerRepo;
    public RestClient restClient;
    public LcContent()
    {
        restClient = new RestClient("https://api.github.com");
        pagesOwnerRepo = ConfigurationManager.AppSettings["pagesOwnerRepo"];
    }

    public IEnumerable<HelpArticle> GetHelpArticleList()
    {
        var request = new RestRequest("/repos/" + pagesOwnerRepo + "/contents/help/articles/", Method.GET);
        request.RequestFormat = DataFormat.Json;

        var response = restClient.Execute<List<HelpPage>>(request);

        List<HelpArticle> helpArticles = new List<HelpArticle>();
        foreach (var page in response.Data)
        {
            HelpArticle article = GetHelpArticle(page.Path);
            helpArticles.Add(article);
        }

        return helpArticles;        
    }

    public HelpArticle GetHelpArticle(string path)
    {
        var request = new RestRequest("/repos/" + pagesOwnerRepo + "/contents/" + path, Method.GET);
        
        request.RequestFormat = DataFormat.Json;

        var response = restClient.Execute<HelpPage>(request);

        var content = Base64Decode(response.Data.Content);

        var article = content.GetFrontMatter<HelpArticleFrontMatter>() ?? new HelpArticleFrontMatter();
        article.Content = ParseMarkdown(content);

        return new HelpArticle { id = article.Id, user_segment_id = 123, title = article.Title, body = article.Content, section_id = article.SectionId };

    }

    private string Base64Decode(string base64EncodedData)
    {
        var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
        return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
    }

    private string ParseMarkdown(string markdown)
    {
        var builder = new MarkdownPipelineBuilder()
            .UseEmphasisExtras()
            .UsePipeTables()
            .UseGridTables()
            .UseFooters()
            .UseFootnotes()
            .UseCitations()
            .UseAutoLinks() // URLs are parsed into anchors
                            //.UseAutoIdentifiers(AutoIdentifierOptions.GitHub) // Headers get id="name" 
            .UseAbbreviations()
            .UseYamlFrontMatter()
            .UseEmojiAndSmiley(true)
            .UseMediaLinks()
            .UseListExtras()
            .UseFigures()
            .UseTaskLists()
            .UseCustomContainers()
            .UseGenericAttributes();
        MarkdownPipeline Pipeline = builder.Build();
        var htmlWriter = new StringWriter();
        var renderer = new HtmlRenderer(htmlWriter);

        Markdown.Convert(markdown, renderer, Pipeline);

        var html = htmlWriter.ToString();

        return html;
    }
    
    public class HelpPage
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public string Content { get; set; }
    }
}