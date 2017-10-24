namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("OwnerStatusHistory")]
    public partial class OwnerStatusHistory
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        [Key]
        [Column(Order = 1)]
        public DateTime OwnerStatusChangedDate { get; set; }

        public int OwnerStatusID { get; set; }

        [Required]
        [StringLength(3)]
        public string OwnerStatusChangedBy { get; set; }
    }
}
