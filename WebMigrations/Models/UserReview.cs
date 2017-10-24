namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class UserReview
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int BookingID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CustomerUserID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ProviderUserID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [StringLength(1000)]
        public string PrivateReview { get; set; }

        [StringLength(500)]
        public string PublicReview { get; set; }

        public byte? Rating1 { get; set; }

        public byte? Rating2 { get; set; }

        public byte? Rating3 { get; set; }

        public byte? Rating4 { get; set; }

        public bool? Answer1 { get; set; }

        public bool? Answer2 { get; set; }

        [StringLength(1000)]
        public string Answer1Comment { get; set; }

        [StringLength(1000)]
        public string Answer2Comment { get; set; }

        public decimal? ServiceHours { get; set; }

        public long? HelpfulReviewCount { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string ModifiedBy { get; set; }
    }
}
