namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class webpages_OAuthMembership
    {
        [Key]
        [Column(Order = 0)]
        [StringLength(30)]
        public string Provider { get; set; }

        [Key]
        [Column(Order = 1)]
        [StringLength(100)]
        public string ProviderUserId { get; set; }

        public int UserId { get; set; }
    }
}
