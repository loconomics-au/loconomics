namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("OwnerAcknowledgment")]
    public partial class OwnerAcknowledgment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        public DateTimeOffset DateAcknowledged { get; set; }

        [Required]
        [StringLength(25)]
        public string AcknowledgedFromIP { get; set; }

        public DateTimeOffset CreatedDate { get; set; }

        public DateTimeOffset UpdatedDate { get; set; }

        [Required]
        [StringLength(200)]
        public string DetectedIPs { get; set; }

        public virtual user user { get; set; }
    }
}
