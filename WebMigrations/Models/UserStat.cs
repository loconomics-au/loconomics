namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class UserStat
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        public decimal? ResponseTimeMinutes { get; set; }

        public DateTime? LastLoginTime { get; set; }

        public DateTime? LastActivityTime { get; set; }

        public virtual user user { get; set; }
    }
}
