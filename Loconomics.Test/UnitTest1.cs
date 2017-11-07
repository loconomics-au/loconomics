using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Reflection;
using System.Prig;
using Urasandesu.Prig.Framework;
using WebMatrix.Data.Prig;

namespace Loconomics.Test
{
    [TestClass]
    public class UnitTest1
    {
        [TestMethod]
        public void PostCodeDataNotNull()
        {
            Type staticType = typeof(LcRest.Address);
            ConstructorInfo ci = staticType.TypeInitializer;
            object[] parameters = new object[0];
            object address = ci.Invoke(null, parameters);
            
            MethodInfo getPostalCodeData = staticType.GetMethod("GetPostalCodeData");
            using (new IndirectionsContext())
            {
                PDateTime.NowGet().Body = () => new DateTime(2017, 12, 13, 12, 00, 00);
                //PDatabase.OpenString().Body = (@this) => new WebMatrix.Data.Database ;

            }
                object data = getPostalCodeData.Invoke(address, new object[] { "90001", 1, true });

            Assert.IsNotNull(data);
        }
    }
}
