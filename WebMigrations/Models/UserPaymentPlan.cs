namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("UserPaymentPlan")]
    public partial class UserPaymentPlan
    {
        public int UserPaymentPlanID { get; set; }

        public int UserID { get; set; }

        [Required]
        [StringLength(250)]
        public string SubscriptionID { get; set; }

        [Required]
        [StringLength(25)]
        public string PaymentPlan { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; }

        public DateTimeOffset PaymentPlanLastChangedDate { get; set; }

        public DateTimeOffset? NextPaymentDueDate { get; set; }

        [Column(TypeName = "money")]
        public decimal? NextPaymentAmount { get; set; }

        public DateTimeOffset FirstBillingDate { get; set; }

        public DateTimeOffset? SubscriptionEndDate { get; set; }

        [Required]
        [StringLength(250)]
        public string PaymentMethodToken { get; set; }

        public DateTimeOffset? PaymentExpiryDate { get; set; }

        [Required]
        [StringLength(50)]
        public string PlanStatus { get; set; }

        public int DaysPastDue { get; set; }
    }
}
