namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class UserReviewScore
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        public long? TotalRatings { get; set; }

        public decimal? Rating1 { get; set; }

        public decimal? Rating2 { get; set; }

        public decimal? Rating3 { get; set; }

        public decimal? Rating4 { get; set; }

        public long? Answer1 { get; set; }

        public long? Answer2 { get; set; }

        public decimal? ServiceHours { get; set; }

        public DateTime? LastRatingDate { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string ModifiedBy { get; set; }
    }
}
