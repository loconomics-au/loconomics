namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("ProviderPaymentAccount")]
    public partial class ProviderPaymentAccount
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ProviderUserID { get; set; }

        [Required]
        [StringLength(100)]
        public string MerchantAccountID { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; }

        [StringLength(400)]
        public string Message { get; set; }

        public string bt_signature { get; set; }

        public string bt_payload { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }
    }
}
