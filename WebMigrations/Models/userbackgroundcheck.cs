namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("userbackgroundcheck")]
    public partial class userbackgroundcheck
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int BackgroundCheckID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime ModifiedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public int StatusID { get; set; }

        [StringLength(200)]
        public string Summary { get; set; }

        [StringLength(25)]
        public string VerifiedBy { get; set; }

        public DateTime? LastVerifiedDate { get; set; }

        public virtual user user { get; set; }
    }
}
