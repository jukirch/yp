sap.ui.define([], 
    function() {

    label: String("Ergebnis: "),
    Ergebnis: function( nOperand1, nOperand2, nOperator){
        switch(nOperator) {

            case "+":
                return nOperand1 + nOperand2;
                case "-":
                    return nOperand1 - nOperand2;
                    case "*":
                        return nOperand1 * nOperand2;
                        case "/":
                        if (nOperand2 != 0){    
                        return nOperand1 / nOperand2;}
                        else {
                            retur
                        }




        }


    }
});