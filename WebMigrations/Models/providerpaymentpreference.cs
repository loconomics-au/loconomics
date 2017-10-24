namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("providerpaymentpreference")]
    public partial class providerpaymentpreference
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ProviderUserID { get; set; }

        public int ProviderPaymentPreferenceTypeID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string Modifiedby { get; set; }

        public bool Verified { get; set; }

        [StringLength(100)]
        public string AccountName { get; set; }

        public decimal? ABANumber { get; set; }

        [StringLength(64)]
        public string LastThreeAccountDigits { get; set; }
    }
}
