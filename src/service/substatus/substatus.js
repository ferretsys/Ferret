import { SYNCED_COMPUTERS, SyncedNetwork } from "../../network_data.js";
import { ComputerConnection } from "../../sockets/computer_sockets.js";
import { isValidOrElseMessage } from "../../structure_validator.js";
import { sendServiceCallMalformed } from "../service_calls.js";

const substatusUpdateSchema = {

    // type = "service_call",
    // endpoint = "substatus",
    // action = "update",
    // computer_id = os.getComputerID(),
    // substatus_id = self.SubstatusId,
    // substatus_label = self.SubstatusLabel,
    // substatus = substatus,
    // substatus_style = "none",
    // order = self:nextOrder()

    // type: "s",
    // endpoint: "s",
    // action: "s",
    // computer_id: "s",
    substatus_id: "s",
    substatus_label: "s",
    substatus: "s",
    substatus_style: "s",
    order: "n",
}

/**
 * @param {SyncedNetwork} net
 * @param {ComputerConnection} computerConnection 
 * */
export function handleSubstatusCallFromComputer(net, computerConnection, message) {
    var validity = isValidOrElseMessage(message, substatusUpdateSchema);
    if (validity !== true) {
        sendServiceCallMalformed(net, computerConnection, validity);
        return;
    }
    if (message.action != "update") {
        sendServiceCallMalformed(net, computerConnection, "Unknown action: " + message.action);
        return;
    }

    var computerData = net.computers[computerConnection.computerId];
    if (computerData.substatus == null) {
        net.computers[computerConnection.computerId].substatus = {};
    }

    if (computerData.substatus[message.substatus_id] == null ||
        computerData.substatus[message.substatus_id].order < message.order) {
        net.computers[computerConnection.computerId].substatus[message.substatus_id] = {
            label: message.substatus_label,
            value: message.substatus,
            style: message.substatus_style,
            order: message.order,
        }
        // console.log("Substatus updated", message.substatus_id, message.substatus_label, message.substatus_style, message.order);
        net.setChanged(SYNCED_COMPUTERS);
    }
}