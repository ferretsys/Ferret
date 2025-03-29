var main_context = getCurrentLoadContext();

function copyInstallCommand() {
    var copyText = main_context.getElementById("install_command");

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

function copyClientCommand() {
    var copyText = main_context.getElementById("client_command");

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

main_context.getElementById("install_command").value =
"wget run " + window.location.origin + "/computer/install.lua?token=" + CurrentAuthKey +
"&host=" + window.location.origin +
"&wshost=" + "ws://" + window.location.host;
    
main_context.getElementById("client_command").value =
`node client ${(window.location.protocol == "https:" ? "wss:" : "ws:") + "//" + window.location.host} ${CurrentAuthKey}`;
   
const computerCountChartElement = main_context.getElementById('computer_connection_chart');

var recivedComputerCountData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const computerCountChart = new Chart(computerCountChartElement, {
    type: 'line',
    data: {
        labels: [300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 0],
        datasets: [{
            labels: 'Computers connected',  
            data: recivedComputerCountData,
            pointHitRadius: 40,
            pointRadius: 0,
            borderWidth: 5,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time (seconds)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        }
    }
});

addDataContentConsumer("connected_computers_chart", (data) => {
    console.log("Recived computer count chart data", data);
    recivedComputerCountData = data;
    computerCountChart.data.datasets[0].data = data;
    computerCountChart.update();
});