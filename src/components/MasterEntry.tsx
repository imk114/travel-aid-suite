import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Receipt, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientData {
  clientName: string;
  fatherName: string;
  mobileNumber: string;
  idProofType: string;
  idProofNumber: string;
}

interface PaymentData {
  serviceType: string;
  paymentMode: string;
  receivedBankName: string;
  transactionId: string;
  amount: number;
  paymentStatus: string;
  bookingDate: string;
}

const MasterEntry = () => {
  const [clientData, setClientData] = useState<ClientData>({
    clientName: "",
    fatherName: "",
    mobileNumber: "",
    idProofType: "",
    idProofNumber: "",
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    serviceType: "",
    paymentMode: "",
    receivedBankName: "",
    transactionId: "",
    amount: 0,
    paymentStatus: "pending",
    bookingDate: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [gstDetails, setGstDetails] = useState({ rate: 0, amount: 0, total: 0 });
  const { toast } = useToast();

  // Calculate GST when amount or service type changes
  const calculateGST = (amount: number, serviceType: string) => {
    let rate = 0;
    if (serviceType === 'self_drive') rate = 18;
    else if (serviceType === 'taxi' || serviceType === 'tour') rate = 5;
    
    const gstAmount = (amount * rate) / 100;
    const total = amount + gstAmount;
    
    setGstDetails({ rate, amount: gstAmount, total });
    return { rate, gstAmount, total };
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setPaymentData(prev => ({ ...prev, amount }));
    calculateGST(amount, paymentData.serviceType);
  };

  const handleServiceTypeChange = (serviceType: string) => {
    setPaymentData(prev => ({ ...prev, serviceType }));
    calculateGST(paymentData.amount, serviceType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!clientData.clientName || !clientData.mobileNumber || !paymentData.serviceType || !paymentData.amount) {
        setError("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      // Insert client data
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          client_name: clientData.clientName,
          father_name: clientData.fatherName,
          mobile_number: clientData.mobileNumber,
          id_proof_type: clientData.idProofType as any,
          id_proof_number: clientData.idProofNumber,
        })
        .select()
        .single();

      if (clientError) {
        console.error('Client insert error:', clientError);
        setError("Failed to save client data");
        setIsLoading(false);
        return;
      }

      // Calculate final GST details
      const { rate, gstAmount, total } = calculateGST(paymentData.amount, paymentData.serviceType);

      // Insert payment data
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          client_id: client.id,
          service_type: paymentData.serviceType as any,
          payment_mode: paymentData.paymentMode as any,
          received_bank_name: paymentData.receivedBankName || null,
          transaction_id: paymentData.transactionId || null,
          amount: paymentData.amount,
          payment_status: paymentData.paymentStatus as any,
          booking_date: paymentData.bookingDate,
          gst_rate: rate,
          gst_amount: gstAmount,
          total_amount: total,
        });

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        setError("Failed to save payment data");
        setIsLoading(false);
        return;
      }

      // Success - reset form
      setClientData({
        clientName: "",
        fatherName: "",
        mobileNumber: "",
        idProofType: "",
        idProofNumber: "",
      });

      setPaymentData({
        serviceType: "",
        paymentMode: "",
        receivedBankName: "",
        transactionId: "",
        amount: 0,
        paymentStatus: "pending",
        bookingDate: new Date().toISOString().split('T')[0],
      });

      setGstDetails({ rate: 0, amount: 0, total: 0 });

      toast({
        title: "Success!",
        description: "Client and payment data saved successfully.",
      });

    } catch (error) {
      console.error('Submit error:', error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserPlus className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Master Entry</h1>
          <p className="text-muted-foreground">Add new client and payment details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Client Information</span>
              </CardTitle>
              <CardDescription>Enter client personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientData.clientName}
                  onChange={(e) => setClientData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter client's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName">Father's Name *</Label>
                <Input
                  id="fatherName"
                  value={clientData.fatherName}
                  onChange={(e) => setClientData(prev => ({ ...prev, fatherName: e.target.value }))}
                  placeholder="Enter father's name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  value={clientData.mobileNumber}
                  onChange={(e) => setClientData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProofType">ID Proof Type</Label>
                <Select value={clientData.idProofType} onValueChange={(value) => setClientData(prev => ({ ...prev, idProofType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="pan">PAN Card</SelectItem>
                    <SelectItem value="license">Driving License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProofNumber">ID Proof Number</Label>
                <Input
                  id="idProofNumber"
                  value={clientData.idProofNumber}
                  onChange={(e) => setClientData(prev => ({ ...prev, idProofNumber: e.target.value }))}
                  placeholder="Enter ID proof number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>Payment Information</span>
              </CardTitle>
              <CardDescription>Enter payment and service details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select value={paymentData.serviceType} onValueChange={handleServiceTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_drive">Self Drive (18% GST)</SelectItem>
                    <SelectItem value="taxi">Taxi Service (5% GST)</SelectItem>
                    <SelectItem value="tour">Tour Package (5% GST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              {/* GST Calculation Display */}
              {paymentData.serviceType && paymentData.amount > 0 && (
                <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Amount:</span>
                    <span>₹{paymentData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST ({gstDetails.rate}%):</span>
                    <span>₹{gstDetails.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{gstDetails.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={paymentData.paymentMode} onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedBankName">Received Bank Name</Label>
                <Input
                  id="receivedBankName"
                  value={paymentData.receivedBankName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, receivedBankName: e.target.value }))}
                  placeholder="Enter bank name (if applicable)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={paymentData.paymentStatus} onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingDate">Booking Date</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={paymentData.bookingDate}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, bookingDate: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Client & Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MasterEntry;