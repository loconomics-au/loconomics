
BEGIN TRANSACTION
ALTER TABLE ProviderPaymentAccount 
ADD PaymentProviderName VARCHAR(100)

UPDATE ProviderPaymentAccount
SET PaymentProviderName = 'braintree'
WHERE PaymentProviderName IS NULL

COMMIT