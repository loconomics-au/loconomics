namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class UserFeePayment
    {
        public int UserFeePaymentID { get; set; }

        public int UserID { get; set; }

        [Required]
        [StringLength(250)]
        public string PaymentTransactionID { get; set; }

        [Required]
        [StringLength(250)]
        public string SubscriptionID { get; set; }

        public DateTimeOffset PaymentDate { get; set; }

        [Column(TypeName = "money")]
        public decimal PaymentAmount { get; set; }

        [Required]
        [StringLength(25)]
        public string PaymentPlan { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentStatus { get; set; }

        public DateTimeOffset CreatedDate { get; set; }

        public DateTimeOffset ModifiedDate { get; set; }
    }
}
