import truckHistoryService from '../services/truckHistoryServices.js'
import truckActualQueue from '../services/truckActualQueue.js'
import truckExportServices from '../services/truckExportServices.js';
import truckAddServices from '../services/truckAddServices.js';
import truckUpdateServices from '../services/truckUpdateServices.js';

const truckControllers = {
    getHistory: async (req, res, next) => {
        try {
            const filters = req.query;
            const result = await truckHistoryService.getTruckHistory(filters);
            return res.json(result);
        } catch (error) {
            res.status(402).json({
                success: false,
                message: error.message
            })
        }
    },
    getTruck: async(req, res, next) => {
        try{
            const filters = req.query;
            const result = await truckHistoryService.getTrucks(filters);
            return res.json(result)
        }
        catch(error){
            res.status(403).json({
                success: false,
                message: error.message
            })
        }
    },
    getTruckActualQueue: async (req, res, next) => {
        try{
            const { id } = req.params;
            const result = await truckActualQueue.getTruckActualQueue(id)
            return res.json(result)
        }
        catch (error){
            res.status(404).json({
                success: false,
                message: error.message
            })
        }
    },
    deleteTruck: async (req, res, next) =>{
        try{
            const { id } = req.params;
            const result = await truckHistoryService.getTrucksDelete(id);
            return res.json(result);
        }
        catch (error){
            res.status(405).json({
                success: false,
                message: error.message
            })
        }
    },
    exportTruck: async (req, res, next) => {
        try{
            const filters = req.query;
            const result = await truckExportServices.exportTrucks(filters);
            return res.json(result);
        }
        catch (error){
            res.status(406).json({
                success: false,
                message: error.message
            })
        }
    },
    createTruck: async (req, res, next) => {
        try {
            const truckData = req.body;
            const result = await truckAddServices.addTruck(truckData);
            return res.json(result);
        } catch (error) {
            console.error('Error in createTruck:', error);
            return res.status(error.statusCode || 407).json({
                success: false,
                message: error.message,
                details: error.message
            });
        }
    },
    updateTrucks: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const result = await truckUpdateServices.updateTruck(id, updateData);
            return res.json(result);
        } catch (error) {
            console.error('Error in updateTruck:', error);
            return res.status(error.statusCode || 407).json({
                success: false,
                message: error.message,
                details: error.message
            });
        }
    }
}

export default truckControllers;